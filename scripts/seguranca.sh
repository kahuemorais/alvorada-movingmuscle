#!/usr/bin/env bash
# Varredura de segurança do projeto em um comando.
#
# Existe porque uma revisão de código achou sete problemas, e leitura humana não roda
# de novo sozinha. As três ferramentas entram no projeto, e não ficam como sugestão no README: cada uma
# cobre uma classe diferente, e o script transforma "lembrar de rodar" em um comando com código de saída.
#
#   pnpm audit      dependência com vulnerabilidade conhecida
#   gitleaks        segredo no código, na configuração e no histórico do git
#   semgrep         padrão de código inseguro em TypeScript, por regra da comunidade
#   osv-scanner     dependência contra a base do OSV, por arquivo de travamento
#
# Ferramenta ausente é falha, e não aviso: aviso silencioso é como o projeto chega em produção sem
# varredura nenhuma. A mensagem diz o comando exato de instalação.
set -euo pipefail

cd "$(dirname "$0")/.."

FALHOU=0

exigir() {
  local binario="$1" instalacao="$2"
  if ! command -v "$binario" >/dev/null 2>&1; then
    echo "FALHA  $binario não instalado. Instale com: $instalacao"
    FALHOU=1
  fi
}

rodar() {
  local nome="$1"
  shift
  if "$@" >/tmp/seguranca-"$nome".log 2>&1; then
    echo "ok     $nome"
  else
    echo "FALHA  $nome (saída em /tmp/seguranca-$nome.log)"
    tail -20 /tmp/seguranca-"$nome".log | sed 's/^/       /'
    FALHOU=1
  fi
}

exigir gitleaks "brew install gitleaks"
exigir semgrep "brew install semgrep"
exigir osv-scanner "brew install osv-scanner"
if [ "$FALHOU" -ne 0 ]; then
  echo
  echo "varredura incompleta: instale o que falta antes de publicar"
  exit 1
fi

# Dependências publicadas com vulnerabilidade conhecida. O limite é baixo de propósito: o projeto tem
# poucas dependências, então até achado de gravidade baixa vale olhar.
rodar "audit" pnpm audit --audit-level=low

# Segredo em qualquer lugar do repositório, incluindo o histórico: chave publicada em commit antigo
# continua publicada depois de removida do arquivo.
rodar "gitleaks" gitleaks git --no-banner --redact --exit-code 1

# Padrão de código inseguro em TypeScript. Os dois conjuntos cobrem erro comum de linguagem e revisão de
# segurança; `--error` faz qualquer achado derrubar o comando.
rodar "semgrep" semgrep --quiet --error --config p/typescript --config p/security-audit --exclude node_modules --exclude .next .

# Dependência contra a base do OSV, pelo arquivo de travamento, que é o que a instalação realmente usa.
rodar "osv" osv-scanner --lockfile pnpm-lock.yaml

echo
if [ "$FALHOU" -ne 0 ]; then
  echo "varredura reprovada"
  exit 1
fi
echo "varredura limpa: quatro frentes sem achado"
