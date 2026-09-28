// Ícones do Phosphor, a mesma família que o kahue.net usa, reunidos em um lugar só para o tamanho e o
// papel de cada um serem decididos aqui e não em cada componente.
//
// Todos são decorativos: quem carrega o significado é o texto ao lado, então saem com aria-hidden e o
// leitor de tela não anuncia o mesmo duas vezes. A importação é a do modo servidor, que rende o SVG
// pronto sem hook de cliente, e é o que o Next recomenda para componente de servidor.
//
// PESO: os ícones são PREENCHIDOS (`weight="fill"`), no lugar do traço fino, e o tamanho e a posição de
// cada um não mudam: o `className` de 16, 20 ou 24 px continua sendo quem decide isso. Duas exceções:
//   - o TELEFONE dentro de botão ou link continua vazado (`IconeTelefoneVazado`): glifo cheio dentro de
//     botão estreito vira mancha;
//   - a MARCA do cabeçalho (`IconeMarca`) continua vazada porque não é ícone de interface: é o desenho da
//     identidade, e ela não engorda.
import {
  ArrowDown,
  Clock,
  ArrowUp,
  BookOpenText,
  Calculator,
  FlowArrow,
  ClockCountdown,
  CurrencyDollar,
  FileText,
  Gauge,
  HardHat,
  HouseLine,
  Info,
  MapPin,
  Minus,
  PhoneCall,
  PiggyBank,
  PlugCharging,
  Plus,
  Quotes,
  Receipt,
  SolarPanel,
  Star,
  Sun,
  WarningCircle,
  Wrench,
} from "@phosphor-icons/react/dist/ssr";

// Tamanhos: emblema de 16 px acompanha o texto de 14; rótulo e resultado de 20 px acompanham o corpo e
// o número; passo, aviso, citação e os botões de mais e menos de 24 px marcam o começo de um bloco e
// ficam legíveis dentro de um botão largo no celular.
const pequeno = "size-4 shrink-0";
const medio = "size-5 shrink-0";
const grande = "size-6 shrink-0";
// A citação subiu um degrau: é marca decorativa de abertura de bloco, e não ícone de rótulo, então ela
// pode passar dos 24 px dos vizinhos.
const citacao = "size-7 shrink-0";

export const IconeConta = () => <Receipt aria-hidden weight="fill" className={medio} />;
export const IconeCobertura = () => <Gauge aria-hidden weight="fill" className={medio} />;
export const IconePainel = () => <SolarPanel aria-hidden weight="fill" className={medio} />;
export const IconeDinheiro = () => <CurrencyDollar aria-hidden weight="fill" className={medio} />;
export const IconeEconomia = () => <PiggyBank aria-hidden weight="fill" className={medio} />;
export const IconeRetorno = () => <ClockCountdown aria-hidden weight="fill" className={medio} />;
export const IconeCasa = () => <HouseLine aria-hidden weight="fill" className={medio} />;
export const IconeEquipe = () => <HardHat aria-hidden weight="fill" className={medio} />;
export const IconeEstrela = () => <Star aria-hidden weight="fill" className={pequeno} />;
// O relógio do tempo de leitura, no tamanho do texto miúdo que o acompanha.
export const IconeTempo = () => <Clock aria-hidden weight="fill" className={pequeno} />;
export const IconeBairro = () => <MapPin aria-hidden weight="fill" className={pequeno} />;
export const IconeTelefone = () => <PhoneCall aria-hidden weight="fill" className={medio} />;
// O telefone dos botões e do link de ligar, vazado de propósito: ver a nota do topo.
export const IconeTelefoneVazado = () => <PhoneCall aria-hidden weight="regular" className={medio} />;
// A seta do botão da abertura aponta para BAIXO, e não para a direita, porque é para onde ele leva: o
// destino é a calculadora, mais abaixo na mesma página. Seta de avanço em link que desce é ícone contando
// outra história.
export const IconeDescer = () => <ArrowDown aria-hidden weight="fill" className={medio} />;
export const IconeVoltar = () => <ArrowUp aria-hidden weight="fill" className={medio} />;
export const IconeMais = () => <Plus aria-hidden weight="fill" className={grande} />;
export const IconeMenos = () => <Minus aria-hidden weight="fill" className={grande} />;
export const IconeDocumento = () => <FileText aria-hidden weight="fill" className={grande} />;
export const IconeChave = () => <Wrench aria-hidden weight="fill" className={grande} />;
export const IconeConexao = () => <PlugCharging aria-hidden weight="fill" className={grande} />;
export const IconeCitacao = () => <Quotes aria-hidden weight="fill" className={citacao} />;
export const IconeAviso = () => <WarningCircle aria-hidden weight="fill" className={medio} />;
export const IconeCalculadora = () => <Calculator aria-hidden weight="fill" className={medio} />;
export const IconePassos = () => <FlowArrow aria-hidden weight="fill" className={medio} />;
// O blog: livro aberto com texto, na medida dos outros itens da barra. O `FileText` de `IconeDocumento`
// diz "documento" e vive em tamanho grande, para marcar o começo de um bloco; aqui o papel é o de item
// de navegação, então o ícone é outro e o tamanho é o mesmo dos quatro vizinhos.
export const IconeBlog = () => <BookOpenText aria-hidden weight="fill" className={medio} />;
export const IconeMarca = () => <Sun aria-hidden className={grande} />;
export const IconeInformacao = () => <Info aria-hidden weight="fill" className={medio} />;
