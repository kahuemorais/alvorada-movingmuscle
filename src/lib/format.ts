// Formatacao no padrao dos Estados Unidos, porque a pagina atende dono de casa americano. O
// Intl faz o trabalho: moeda com separador de milhar e duas casas, numero inteiro com milhar.
//
// A guarda de numero nao finito e a segunda camada, e nao a primeira: o esquema da cidade ja barra dado
// invalido na entrada. Ela existe porque o modo de falha e conhecido: cidade de tarifa zero
// rendendo "infinito, $NaN, NaN years" na tela: falhar o build e sempre melhor do que publicar numero
// quebrado, e a mensagem diz qual formatador recebeu o valor, para o build apontar o lugar.
const usdFmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
// O dólar redondo precisa de formatador próprio, e não de um `round` antes do formatador cheio: o `Intl` com
// `style: currency` sempre escreve os centavos, então `usdRedondo(179)` saía "$179.00" e o número continuava com
// cara de extrato. Foi o teste que mostrou, não a leitura do código.
const usdInteiroFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const numFmt = new Intl.NumberFormat("en-US");

function finito(valor: number, formatador: string): number {
  if (!Number.isFinite(valor)) {
    throw new Error(`${formatador} recebeu número não finito: ${String(valor)}`);
  }
  return valor;
}

export const usd = (n: number) => usdFmt.format(finito(n, "usd"));

// O número em destaque lê como ferramenta, e o centavo é coisa de extrato: "$179.01" no cartão do
// resultado e "1.466,67 kWh" na conta detalhada convivem bem, porque a
// segunda é onde a pessoa confere a aritmética; o destaque pede o valor redondo. O arredondamento é SÓ de
// apresentação: `simulate()` continua devolvendo o centavo, e é ele que a lista das contas mostra.
export const usdRedondo = (n: number) => usdInteiroFmt.format(Math.round(finito(n, "usdRedondo")));
export const num = (n: number) => numFmt.format(finito(n, "num"));
export const anos = (n: number) => `${finito(n, "anos").toFixed(1)} years`;
export const porcento = (n: number) => `${numFmt.format(finito(n, "porcento"))}%`;

// Alíquota guardada como fração no arquivo da cidade (0,3) virando o rótulo que a pessoa lê (30%). Existe
// como função porque o rótulo do simulador e a descrição de metadados precisam do mesmo número, e porque
// antes esse 30 estava escrito à mão nos dois lugares: dado que muda com rótulo fixo é rótulo que mente.
// Nota de avaliação, sempre com uma casa: o dado traz 5 e 4.9, e sem formatador a linha mistura as duas
// escalas ("5" ao lado de "4.9").
export const nota = (valor: number) => finito(valor, "nota").toFixed(1);

export const porcentoCheio = (fracao: number) =>
  `${numFmt.format(Math.round(finito(fracao, "porcentoCheio") * 100))}%`;
