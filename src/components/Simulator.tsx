"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Aparecer } from "@/components/Aparecer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import {
  IconeAviso,
  IconeCalculadora,
  IconeCasa,
  IconeCobertura,
  IconeConta,
  IconeDescer,
  IconeDinheiro,
  IconeEconomia,
  IconeInformacao,
  IconeMais,
  IconeMenos,
  IconePainel,
  IconeRetorno,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { trackSimulationCompleted, trackSimulationStarted } from "@/lib/analytics";
import type { City } from "@/lib/city";
import { anos, num, porcento, porcentoCheio, usd, usdRedondo } from "@/lib/format";
import { simulate } from "@/lib/solar";

const CONTA_MIN = 40;
const CONTA_MAX = 600;
const CONTA_PASSO = 10;
// A cobertura vai de 50 a 100 por cento, de cinco em cinco pontos. Antes a pagina oferecia tres pontos
// (50, 80 e 100), que nao atendia a grade, apesar de os tres valores continuarem validos.
const COBERTURA_MIN = 50;
const COBERTURA_MAX = 100;
const COBERTURA_PASSO = 5;

// Os tres pontos nomeados continuam existindo, agora como atalho: e neles que esta a frase que explica a
// consequencia de cada faixa de escolha.
const COBERTURAS = [
  { valor: 50, rotulo: "Half", nota: "a smaller system, the lowest price" },
  { valor: 80, rotulo: "Most", nota: "what most homes here choose" },
  { valor: 100, rotulo: "All", nota: "the extra becomes bill credit, not payment" },
] as const;

const coberturaValida = (valor: number) =>
  Number.isFinite(valor) &&
  valor >= COBERTURA_MIN &&
  valor <= COBERTURA_MAX &&
  valor % COBERTURA_PASSO === 0;

// A frase de consequencia existe para os tres pontos nomeados. Para um valor do meio, vale a frase do ponto
// mais proximo: inventar uma frase por valor seria afirmar o que ninguem escreveu, e nao dizer nada seria
// pior que dizer a mais proxima.
const pontoMaisProximo = (valor: number) =>
  COBERTURAS.reduce((a, b) => (Math.abs(b.valor - valor) < Math.abs(a.valor - valor) ? b : a));
// E o estado inicial da tabela de referencia, nao uma trava.
const CONTA_PADRAO = 220;
const COBERTURA_PADRAO = 80;

type Estado = { bill: number; coverage: number };

// O estado vive na query string porque o endereco e enviado por mensagem para quem decide junto:
// quem recebe o link precisa abrir a MESMA simulacao, nao a pagina em branco.
//
// A URL e lida com useSyncExternalStore, e nao com estado copiado para dentro do React. Duas razoes.
// A primeira e o link compartilhado: com estado copiado, ler a URL no efeito de montagem e escrever
// a URL em outro efeito disputam o mesmo ciclo, e no modo estrito do React os efeitos rodam duas
// vezes, entao a escrita apagava a leitura e o link abria no padrao. A segunda e que aqui nao existe
// estado paralelo para sincronizar: a simulacao E a URL, e mudar o controle escreve a URL.
function subscrever(avisar: () => void) {
  window.addEventListener("popstate", avisar);
  window.addEventListener(EVENTO_URL, avisar);
  return () => {
    window.removeEventListener("popstate", avisar);
    window.removeEventListener(EVENTO_URL, avisar);
  };
}

function lerBusca(): string {
  return window.location.search;
}

// No servidor e na hidratacao nao existe URL: devolve vazio, que e o padrao. Depois de hidratar, o
// React le a busca de verdade e ja mostra a simulacao do link, sem aviso de divergencia.
function lerBuscaNoServidor(): string {
  return "";
}

function estadoDaBusca(busca: string): Estado | null {
  const params = new URLSearchParams(busca);
  const bill = Number(params.get("bill"));
  const coverage = Number(params.get("coverage"));
  if (!params.has("bill") || !params.has("coverage")) return null;
  if (!Number.isFinite(bill) || !Number.isFinite(coverage)) return null;
  if (bill < CONTA_MIN || bill > CONTA_MAX) return null;
  if (!coberturaValida(coverage)) return null;
  return { bill, coverage };
}

const EVENTO_URL = "brightfield:url";

const PADRAO: Estado = { bill: CONTA_PADRAO, coverage: COBERTURA_PADRAO };

export default function Simulator({ city }: { city: City }) {
  const busca = useSyncExternalStore(subscrever, lerBusca, lerBuscaNoServidor);
  // A campanha vive na busca da PRIMEIRA visita, e o simulador reescreve a URL a cada ajuste (`replaceState`
  // com bill e coverage), o que apaga as tags. Lidas no momento do evento, elas já não existem: o evento
  // chegava ao time de mídia sem saber QUAL anúncio gerou a simulação — que é exatamente o que este módulo
  // existe para responder. Por isso a busca da campanha é capturada uma vez, no primeiro render, antes de
  // qualquer escrita, e é ela que vai para os dois eventos.
  const [buscaDaCampanha] = useState(() => (typeof window === "undefined" ? "" : window.location.search));
  const [perfil, setPerfil] = useState<string | null>(null);

  const estado = useMemo(() => estadoDaBusca(busca) ?? PADRAO, [busca]);
  const resultado = useMemo(() => simulate(city, estado), [city, estado]);

  // O estado inicial é o da tabela de referência — $220 com 80% de cobertura —, e $220 é a conta típica
  // da "Three-bedroom house, no pool". Esse é o cartão que nasce marcado, e não o primeiro da lista (a conta de $90) nem
  // qualquer outro. A marcação é DERIVADA do estado, e não um `useState` com o índice: assim o cartão certo se
  // acende também quando alguém abre um link compartilhado que traz exatamente $220 / 80%, e nenhum cartão se acende
  // quando o link traz outro estado (a simulação é do link, não de um perfil). Clicar num cartão fixa a escolha em
  // `perfil` e ela sobrevive a mexer na conta depois.
  const perfilAtivo = useMemo(() => {
    if (perfil !== null) return perfil;
    if (estado.bill !== CONTA_PADRAO || estado.coverage !== COBERTURA_PADRAO) return null;
    const indice = city.householdProfiles.findIndex((item) => item.typicalBill === CONTA_PADRAO);
    return indice >= 0 ? String(indice) : null;
    // `perfil` e `estado` são as duas entradas; `city` muda o rótulo do cartão, não a conta típica.
  }, [perfil, estado, city]);

  // Escreve a URL e avisa quem estiver lendo, que e a propria pagina. `replaceState` em vez do
  // router: a pagina e estatica, nao ha navegacao a registrar, e sem isso cada arrasto do controle
  // entraria no historico do navegador.
  const aplicar = (novo: Estado, novoPerfil: string | null) => {
    const params = new URLSearchParams({ bill: String(novo.bill), coverage: String(novo.coverage) });
    window.history.replaceState(null, "", `?${params.toString()}`);
    window.dispatchEvent(new Event(EVENTO_URL));
    setPerfil(novoPerfil);
  };

  // Evento de simulacao, disparado depois que a pessoa para de mexer: sem a espera, cada passo do
  // controle viraria uma simulacao no relatorio da equipe de midia e o numero perderia sentido.
  const primeiraVolta = useRef(true);
  const comecou = useRef(false);

  useEffect(() => {
    if (primeiraVolta.current) {
      primeiraVolta.current = false;
      return;
    }
    if (!comecou.current) {
      comecou.current = true;
      // O perfil vai o ATIVO, e não só o que foi clicado: com o estado inicial já sendo um perfil da tabela,
      // o evento do primeiro ajuste diria "none" enquanto a tela mostra o cartão de três quartos marcado.
      trackSimulationStarted(buscaDaCampanha, perfilAtivo);
    }
    const relogio = setTimeout(() => {
      trackSimulationCompleted(resultado, estado, buscaDaCampanha, perfilAtivo);
    }, 1000);
    return () => clearTimeout(relogio);
    // `buscaDaCampanha` fica na lista porque e lida aqui dentro e nunca muda depois do primeiro render: o
    // efeito continua disparando pelos mesmos tres motivos, mas o aviso do lint nao fica em pe.
  }, [estado, perfil, perfilAtivo, resultado, buscaDaCampanha]);

  // Rascunho do campo de conta: enquanto a pessoa digita, o texto vive aqui e nao na URL, senao
  // digitar 4 de 430 viraria 40 no meio da digitacao. O rascunho e so o texto em edicao; a simulacao
  // continua sendo a URL, e ele e descartado ao sair do campo.
  const [rascunho, setRascunho] = useState<string | null>(null);

  const definirConta = (valor: number) => {
    const preso = Math.min(CONTA_MAX, Math.max(CONTA_MIN, valor));
    aplicar({ ...estado, bill: Math.round(preso / CONTA_PASSO) * CONTA_PASSO }, perfil);
  };

  const confirmarRascunho = () => {
    if (rascunho === null) return;
    const numero = Number(rascunho.replace(/[^0-9]/g, ""));
    setRascunho(null);
    if (Number.isFinite(numero) && numero > 0) definirConta(numero);
  };

  const escolherPerfil = (indice: string) => {
    // O card preenche a conta típica daquele perfil e não encosta na cobertura.
    //
    // Antes ele também devolvia a cobertura ao padrão de 80, para fechar a quarta linha da tabela de
    // aceitação. Não é exigência: o teste da tabela (`src/lib/aceitacao.test.ts`) roda por estado, com
    // conta e cobertura passadas direto ao cálculo, e passa com ou sem o reset. Era decisão de interface, e
    // descartava em silêncio uma escolha de quem estava usando a página: com 50% marcado, tocar num card
    // devolvia 80 sem explicação.
    aplicar({ ...estado, bill: city.householdProfiles[Number(indice)].typicalBill }, indice);
  };

  // O que sobra da conta depois da economia. A economia nunca passa da conta (regra 3, em `src/lib/solar.ts`), então
  // a conta final nunca fica negativa, e o número é aritmética da própria simulação, não dado novo.
  const contaFinal = estado.bill - resultado.monthlySavings;

  // As seis contas que a página explica, na ordem, cada uma com o número que esta cidade já traz. Vivem como dado,
  // e não como seis parágrafos escritos na mão, por dois motivos: o termo da linha é o mesmo que abre a frase, e
  // a numeração sai da POSIÇÃO, nunca de um contador que soma na renderização. Nenhum valor é novo: todos saem de
  // `simulate()` ou do arquivo da cidade.
  const contas = [
    {
      termo: "Usage",
      texto: `${usd(estado.bill)} a month at ${usd(city.utilityRatePerKwh)} per kWh is ${num(resultado.monthlyUsageKwh)} kWh.`,
    },
    {
      termo: "Target",
      texto: `${porcento(estado.coverage)} of that, or ${num(resultado.targetKwh)} kWh.`,
    },
    {
      termo: "One panel",
      texto: `${num(city.panelWatts)} W at ${city.peakSunHoursPerDay} peak sun hours a day and a ${city.performanceRatio} performance factor makes ${num(resultado.panelGenerationKwh)} kWh a month.`,
    },
    {
      termo: "Panels",
      // Dois passos, e a frase diz os dois: o teto do número cru e, depois, o piso da cidade. Antes ela usava
      // o número final no lugar do teto e dizia que o piso estava abaixo dele, o que contradiz o cálculo.
      texto:
        `${num(resultado.panelsRaw)} of them, and a panel is a whole unit, so that is ${num(Math.ceil(resultado.panelsRaw))}.` +
        (resultado.flags.minPanelsApplied
          ? ` ${city.city} also sets a minimum of ${num(city.minPanels)} panels per installation, and that floor is above the rounded number, so the smallest system here is ${num(resultado.panels)}.`
          : ""),
    },
    {
      termo: "Price",
      texto: `${num(resultado.panels)} panels at ${num(city.panelWatts)} W and ${usd(city.costPerWattInstalled)} per watt installed is ${usd(resultado.investmentGross)}. The ${porcentoCheio(city.federalCreditRate)} federal credit takes it to ${usd(resultado.investmentAfterCredit)}.`,
    },
    {
      termo: "Savings",
      texto:
        `${num(resultado.generationKwh)} kWh a month is ${usd(resultado.rawGenerationValue)} of electricity. ` +
        (resultado.flags.savingsCapped
          ? `Your bill is the ceiling, so savings stop at ${usd(resultado.monthlySavings)}.`
          : "All of it comes off your bill.") +
        ` Payback: ${usd(resultado.investmentAfterCredit)} over twelve months of savings is ${anos(resultado.paybackYears)}.`,
    },
  ];

  return (
    // Faixa 1: o fundo da página (`canvas`). A seção passou a ser a faixa — largura da janela, respiro vertical
    // próprio — e o conteúdo vive na coluna de 64 rem por dentro dela, que é o arranjo da abertura. O `pb` do
    // celular reserva a altura da barra fixa mais a área segura, como na rodada anterior; do tamanho médio para
    // cima a barra sobe para o topo e o respiro volta a ser o degrau de 64.
    <section
      id="simulator"
      aria-labelledby="simulator-title"
      className="w-full bg-canvas py-xxl pb-[calc(var(--spacing-xxl)_+_env(safe-area-inset-bottom))] sm:pb-xxl"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-lg px-lg">
      <header className="flex flex-col gap-sm">
        {/* Sobrancelha na linguagem das outras seções (filete e rótulo curto), com trabalho: a calculadora é o
            produto da página, e é esta linha que a separa do resto, do mesmo jeito que os três passos e a
            prova social já se apresentam. */}
        <p className="flex items-center gap-sm type-label text-support">
          <span aria-hidden className="h-px w-xl bg-support" />
          The calculator
        </p>
        <h2 id="simulator-title" className="type-title text-ink md:max-w-[54rem]">
          Run the numbers for your own roof
        </h2>
        <p className="type-body text-support max-w-measure">
          Type your bill or pick a home like yours. The numbers update as you change them, and nothing
          is sent anywhere until you ask for a site visit.
        </p>
      </header>

      <div className="grid gap-lg rounded-xl border border-outline bg-surface/60 p-lg md:grid-cols-2">
        <div className="flex flex-col gap-xl">
          {/* Perfis primeiro porque a maioria não sabe a conta na hora, e o caminho mais rápido passa a ser o
              primeiro da coluna. O campo
              continua editável logo abaixo,
              com a cobertura no degrau seguinte, e escolher um cartão só troca a conta — a cobertura não volta ao
              padrão (ver `escolherPerfil`).

              Um cartao por perfil, e nao uma linha com bolinha: o rotulo desses perfis tem duas
              informacoes (o tipo de casa e a conta tipica) e em linha unica a segunda some. O cartao
              inteiro e a area clicavel, o que da 48 px de alvo sem apertar o desenho, e o escolhido
              ganha a borda na cor de acao, que e a unica cor de decisao da pagina. */}
          <fieldset className="flex flex-col gap-md">
            {/* O título do bloco perdeu o "Or" quando os perfis subiram para o topo da coluna: o "Or" era da ordem
                antiga, em que este bloco era a segunda opção depois do campo da conta. Agora ele ABRE a coluna, então
                a conjunção sobrava e o rótulo volta a ser um convite direto. O lead da seção continua como estava. */}
            <legend className="mb-md flex items-center gap-sm type-label text-ink">
              <span className="text-primary-dark">
                <IconeCasa />
              </span>
              Start from a home like yours
            </legend>
            {/* Atalho, e não formulário: os quatro cartões com bolinha de rádio pareciam formulário, e o estado
                escolhido estava fraco. A bolinha saiu, o cartão inteiro ficou clicável e
                o escolhido passa a ser marcado pela borda e pelo anel da cor de ação (`aria-pressed`), que é o
                mesmo recurso que os atalhos Half, Most e All já usam um degrau acima. O nome acessível continua
                sendo o rótulo do perfil com a conta típica, e o estado vai em `aria-pressed`, então o leitor de
                tela ouve o mesmo que ouvia antes. */}
            <div className="grid gap-sm sm:grid-cols-2">
              {city.householdProfiles.map((item, indice) => (
                // Fundo próprio no escolhido (`bg-canvas`), além da borda e do anel: a borda sozinha marcava o
                // cartão, mas o escolhido continuava com a mesma superfície branca dos outros três, e a leitura
                // de estado à primeira vista é o que se quer aqui. O par é o do resto da página (canvas atrás, surface
                // na frente), e não a tinta de ação cheia: tinta cheia num cartão de duas linhas de texto viraria
                // botão, e a borda da cor de ação já diz que ele é o escolhido.
                <button
                  key={item.label}
                  type="button"
                  data-perfil={indice}
                  aria-pressed={perfilAtivo === String(indice)}
                  onClick={() => escolherPerfil(String(indice))}
                  className="flex min-h-touch flex-col gap-xs rounded-md border border-outline bg-surface p-md text-left transition-colors hover:border-ink/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink aria-pressed:border-primary aria-pressed:bg-canvas aria-pressed:ring-1 aria-pressed:ring-primary"
                >
                  <span className="type-body text-ink">{item.label}</span>
                  <span className="microcopy">About {usdRedondo(item.typicalBill)} a month</span>
                </button>
              ))}
            </div>
          </fieldset>

          {/* A borda do campo e a do controle usado é a cor de contorno, e não um cinza claro: o Material
              pede 3 para 1 de contraste em limite de componente, e ink a 15% mede 1,37, que não identifica
              nada. Com o token `outline` mede 3,96 sobre o branco e 3,66 sobre o fundo da página. */}
          {/* Campo com passo de cada lado, no lugar do controle deslizante: quem sabe a conta de luz
              sabe o numero, nao a posicao de um botao numa barra. Os dois botoes cobrem o ajuste fino
              e o campo aceita o valor exato. */}
          <div className="flex flex-col gap-sm">
            <label htmlFor="bill" className="flex items-center gap-sm type-label text-ink">
              <span className="text-primary-dark">
                <IconeConta />
              </span>
              Average monthly electric bill
            </label>
            {/* Uma caixa só, da largura da coluna, com os dois passos dentro. Antes a caixa da conta tinha
                144 px por causa de um limite de largura que ninguém pediu e os botões ficavam do lado de
                fora, então o simulador mostrava quatro controles com três larguras diferentes: a conta, o
                cursor de cobertura, os atalhos e os cartões de perfil. */}
            <div className="flex min-h-touch items-center gap-xs rounded-lg border border-outline bg-surface px-xs focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                className="min-h-touch min-w-touch shrink-0"
                aria-label={`Lower the bill by ${usdRedondo(CONTA_PASSO)}`}
                onClick={() => definirConta(estado.bill - CONTA_PASSO)}
              >
                <IconeMenos />
              </Button>
              <span aria-hidden className="microcopy">
                $
              </span>
                <input
                  id="bill"
                  type="number"
                  inputMode="decimal"
                  min={CONTA_MIN}
                  max={CONTA_MAX}
                  step={CONTA_PASSO}
                  value={rascunho ?? estado.bill}
                  aria-describedby="bill-hint"
                  onChange={(evento) => setRascunho(evento.target.value)}
                  onBlur={confirmarRascunho}
                  onKeyDown={(evento) => {
                    if (evento.key === "Enter") {
                      confirmarRascunho();
                      evento.currentTarget.blur();
                    }
                  }}
                  className="h-full min-w-0 flex-1 bg-transparent px-xs type-lead text-ink tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                className="min-h-touch min-w-touch shrink-0"
                aria-label={`Raise the bill by ${usdRedondo(CONTA_PASSO)}`}
                onClick={() => definirConta(estado.bill + CONTA_PASSO)}
              >
                <IconeMais />
              </Button>
            </div>
            <p id="bill-hint" className="microcopy">
              Between {usdRedondo(CONTA_MIN)} and {usdRedondo(CONTA_MAX)}, in steps of {usdRedondo(CONTA_PASSO)}.
            </p>
          </div>

          <fieldset className="flex flex-col gap-md">
            <legend className="mb-md flex items-center gap-sm type-label text-ink">
              <span className="text-primary-dark">
                <IconeCobertura />
              </span>
              Share of your usage you want to cover
            </legend>
            {/* Cursor de cinco em cinco, com o valor sempre visível ao lado. O controle deslizante foi
                recusado aqui quando a escolha era de três caminhos, porque escondia o número; com o valor
                na linha de cima ele não esconde nada, e é o único controle que dá a grade que o documento
                pede sem virar onze cartões. */}
            <div className="flex min-h-touch items-center gap-md rounded-lg border border-outline bg-surface px-md">
              <span className="type-lead tabular-nums text-ink">{porcento(estado.coverage)}</span>
              <input
                type="range"
                min={COBERTURA_MIN}
                max={COBERTURA_MAX}
                step={COBERTURA_PASSO}
                value={estado.coverage}
                aria-label="Share of your usage you want to cover"
                aria-valuetext={`${porcento(estado.coverage)} of your usage`}
                onChange={(evento) =>
                  aplicar({ ...estado, coverage: Number(evento.target.value) }, perfil)
                }
                className="h-touch flex-1 accent-primary"
              />
            </div>
            {/* Os três pontos nomeados, como atalho: é neles que está a frase que explica cada faixa. */}
            <div className="flex flex-wrap gap-xs">
              {COBERTURAS.map((opcao) => (
                <button
                  key={opcao.valor}
                  type="button"
                  onClick={() => aplicar({ ...estado, coverage: opcao.valor }, perfil)}
                  aria-pressed={estado.coverage === opcao.valor}
                  className="min-h-touch flex-1 rounded-sm border border-outline px-md type-label text-ink transition-colors hover:bg-canvas aria-pressed:border-primary aria-pressed:ring-1 aria-pressed:ring-primary"
                >
                  {opcao.rotulo} · <span className="tabular-nums">{porcento(opcao.valor)}</span>
                </button>
              ))}
            </div>
            {/* A consequência da escolha, em uma linha, com a frase do ponto nomeado mais próximo. */}
            <p className="microcopy">
              {pontoMaisProximo(estado.coverage).rotulo} of your usage:{" "}
              {pontoMaisProximo(estado.coverage).nota}. Extra power goes to {city.utilityName} as bill
              credit.
            </p>
          </fieldset>

        </div>

        {/* O resultado deixou de ser quatro números do mesmo tamanho: a economia manda, que é a pergunta que
            a página promete responder, e os outros três viram linhas de conta, com rótulo de
            um lado e valor do outro, separadas por fio de 1 px. Antes os quatro estavam no mesmo degrau de
            48 px e nada dizia qual deles era a resposta. */}
        <Card className="h-fit">
          <CardContent className="flex flex-col gap-lg py-6">
            <p className="flex items-center gap-sm type-label text-support">
              <span aria-hidden className="h-px w-xl bg-support" />
              Your estimate
            </p>

            {/* aria-live: o numero muda enquanto a pessoa arrasta, entao o leitor de tela precisa ser
                avisado sem que o foco saia do controle. */}
            <output aria-live="polite" className="flex flex-col gap-lg">
              {/* O bloco da economia, no degrau de número e com a frase que diz em quanto a conta fica. O filete
                  âmbar que atravessava a coluna acima do rótulo saiu: com ele o bloco tinha duas aberturas (o
                  filete e o rótulo) e o valor perdia o posto de começo do cartaz. */}
              <div className="flex flex-col gap-sm">
                <p className="flex items-center gap-sm type-label text-support">
                  <span className="text-primary-dark">
                    <IconeEconomia />
                  </span>
                  Monthly savings
                </p>
                <Valor texto={usdRedondo(resultado.monthlySavings)} className="type-number savings tabular-nums" />
                <p className="type-body text-support max-w-measure">
                  On a {usdRedondo(estado.bill)} bill with {porcento(estado.coverage)} of your usage
                  covered. Your bill goes to about {usdRedondo(contaFinal)} a month.
                </p>
              </div>

              {/* Uma linha para os painéis e uma linha de dois para custo e retorno: são as três contas de
                  conferência, e as duas últimas ficam lado a lado, em vez de empilhadas. */}
              <div className="flex flex-wrap items-baseline justify-between gap-x-md gap-y-xs border-t border-border py-md">
                <p className="flex items-center gap-sm type-label text-support">
                  <span className="text-primary-dark">
                    <IconePainel />
                  </span>
                  Panels
                </p>
                <Valor texto={num(resultado.panels)} className="type-lead text-ink tabular-nums" />
              </div>

              <div className="grid grid-cols-2 gap-md border-t border-border pt-md">
                <div className="flex flex-col gap-xs">
                  <p className="flex items-center gap-sm type-label text-support">
                    <span className="text-primary-dark">
                      <IconeDinheiro />
                    </span>
                    Cost after the {porcentoCheio(city.federalCreditRate)} federal credit
                  </p>
                  <Valor
                    texto={usdRedondo(resultado.investmentAfterCredit)}
                    className="type-lead text-ink tabular-nums"
                  />
                </div>
                <div className="flex flex-col gap-xs">
                  <p className="flex items-center gap-sm type-label text-support">
                    <span className="text-primary-dark">
                      <IconeRetorno />
                    </span>
                    Years to payback
                  </p>
                  <Valor texto={anos(resultado.paybackYears)} className="type-lead text-ink tabular-nums" />
                </div>
              </div>
            </output>

            {resultado.flags.minPanelsApplied ? (
              <Alert>
                <IconeAviso />
                <AlertTitle>Why more panels than you asked for</AlertTitle>
                <AlertDescription>
                  Your usage would need {num(Math.ceil(resultado.panelsRaw))} panels. A panel is a whole
                  unit and every installation in {city.city} has a minimum of {num(city.minPanels)}, so
                  the smallest system you can order is {num(city.minPanels)} panels. That is why the
                  price does not drop below {usdRedondo(resultado.investmentAfterCredit)}.
                </AlertDescription>
              </Alert>
            ) : null}

            {resultado.flags.savingsCapped ? (
              <Alert>
                <IconeInformacao />
                <AlertTitle>Your system would generate more than you use</AlertTitle>
                <AlertDescription>
                  These panels would produce {usd(resultado.flags.generationValue)} of electricity a
                  month, above your {usd(estado.bill)} bill. The extra{" "}
                  {usd(resultado.flags.surplusValue)} goes to {city.utilityName} as credit against future
                  bills, and credit never turns into a payment, so your savings stop at the size of your bill.
                </AlertDescription>
              </Alert>
            ) : null}

          </CardContent>
        </Card>
      </div>

      {/* A explicação do valor e o aviso de estimativa são UM bloco só, abaixo do forro, e não dois cards nem
          conteúdo dentro do cartão do resultado. O caminho até aqui: dentro do cartão os três blocos ficavam
          grudados, e dois cards lado a lado ainda eram conteúdo demais. O que ficou: uma caixa, as seis contas em linhas numeradas (duas
          colunas no desktop) com o termo em tinta e a frase em apoio, e o aviso fechando o bloco. O que o aviso
          repetia das contas saiu dele: a tarifa e as horas de sol estão na conta 1 e na 3, e o crédito federal na
          5. O bloco entra na rolagem como as outras seções, e as linhas chegam escalonadas de 60 em 60 ms, que é o
          mesmo recurso dos cartões dos três passos. */}
      <Aparecer>
        <div
          id="como-calculamos"
          className="flex flex-col gap-md rounded-lg border border-outline bg-surface p-lg"
        >
          <h3 className="flex items-center gap-sm type-lead text-ink">
            <span className="text-primary-dark">
              <IconeCalculadora />
            </span>
            How this estimate is built
          </h3>
          <p className="type-body text-support max-w-measure">
            Six counts, in this order, with the numbers {city.city} runs on.
          </p>
          {/* Numeração leve: o número vive em etiqueta de contorno sobre o fundo da página, e não em selo escuro.
              Numeração é orientação, não destaque, e é a mesma regra que o blog segue. O `role="list"` é o que devolve a semântica de lista ao leitor de tela quando a
              marcação do navegador sai de cena (`list-none`), já que o número visível é decoração. */}
          <ol role="list" className="grid list-none gap-md gap-x-xl md:grid-cols-2">
            {contas.map((conta, indice) => (
              <li
                key={conta.termo}
                className="ecoar flex items-start gap-sm"
                style={{ animationDelay: `${indice * 60}ms` }}
              >
                <span
                  aria-hidden
                  className="flex size-5 shrink-0 items-center justify-center rounded-sm border border-outline bg-canvas type-label text-ink tabular-nums"
                >
                  {indice + 1}
                </span>
                <span className="flex flex-col gap-xs">
                  <span className="type-label text-ink">{conta.termo}</span>
                  <span className="type-body text-support">{conta.texto}</span>
                </span>
              </li>
            ))}
          </ol>
          <div id="aviso-estimativa" className="flex flex-col gap-sm border-t border-border pt-md">
            <h3 className="flex items-center gap-sm type-label text-ink">
              <span className="text-primary-dark">
                <IconeInformacao />
              </span>
              Estimate, not a proposal
            </h3>
            <ul className="flex flex-col gap-xs type-body text-support">
              <li>
                The rate and the sun hours above are the reference numbers for {city.city}, not your own. Your
                rate depends on the plan you are on, and production moves with shade, roof angle, panel model
                and weather.
              </li>
              <li>
                So this is an estimate, not a quote. The number that counts is the one a technician confirms
                after measuring your roof.
              </li>
            </ul>
        </div>
        </div>
      </Aparecer>

      {/* A chamada do meio, com o número que a pessoa acabou de ver. Medido antes: entre 15% e 97% da altura
          da página não existia nenhuma ação, que é o que faz quem está no celular desistir no meio.
          O bloco estava apagado, e o destaque é o mesmo recurso que o projeto já usa no depoimento em
          destaque: tinta da cor de ação a 25%, que é o nível medido que não lê como papel branco, com borda da
          mesma cor. O botão vira o escuro aqui, porque botão da cor de ação sobre fundo da cor de ação
          desaparece.
          A ação deixou de ser a ligação e passou a ser o convite que continua a simulação, sem pedir telefone
          nem email antes de a pessoa demonstrar interesse. O telefone continua a um toque na abertura, no fecho
          e na barra. */}
      <div
        id="meio-cta"
        className="flex flex-col gap-md rounded-lg border border-primary bg-primary/25 p-lg md:flex-row md:items-center md:justify-between"
      >
        <div className="flex flex-col gap-sm">
          {/* Sobrancelha com filete, o mesmo recurso das seções. */}
          <p className="flex items-center gap-sm type-label text-ink">
            <span aria-hidden className="h-px w-xl bg-ink/60" />
            Next step
          </p>
          <p className="type-lead text-ink">Want to see what your actual roof could look like?</p>
          {/* Os números da simulação continuam no bloco: era a informação mais importante dele e estava
              dissolvida no meio da frase. */}
          <p className="type-body max-w-measure text-ink/90">
            On your {usdRedondo(estado.bill)} bill with {porcento(estado.coverage)} covered, the estimate
            is {num(resultado.panels)} panels and {usdRedondo(resultado.monthlySavings)} back every month. The site
            visit measures the roof, checks the layout against your own usage and confirms the price
            before anything is signed. It costs nothing, and you do not leave a phone number or an email
            to ask for it.
          </p>
        </div>
        <Button asChild size="lg" className="w-full shrink-0 md:w-auto">
          <a href="#agendar">
            Book the site visit
            <IconeDescer />
          </a>
        </Button>
      </div>
      </div>
    </section>
  );
}

// O número que acabou de mudar dá um pulso curto. Aqui movimento não é enfeite: é o que diz QUAL dos quatro
// números respondeu ao que a pessoa mexeu, que é a regra da casa para animação — mostrar causa e efeito.
// Sem estado do React: a classe entra e sai pelo próprio elemento, e o `prefers-reduced-motion` global já
// reduz a animação a nada para quem pediu menos movimento.
function Valor({ texto, className }: { texto: string; className: string }) {
  const alvo = useRef<HTMLParagraphElement>(null);
  const anterior = useRef(texto);

  useEffect(() => {
    const el = alvo.current;
    if (!el || anterior.current === texto) return;
    anterior.current = texto;
    el.classList.remove("pulsou");
    void el.offsetWidth;
    el.classList.add("pulsou");
    const fim = () => el.classList.remove("pulsou");
    el.addEventListener("animationend", fim, { once: true });
    return () => el.removeEventListener("animationend", fim);
  }, [texto]);

  return (
    <p ref={alvo} className={className}>
      {texto}
    </p>
  );
}
