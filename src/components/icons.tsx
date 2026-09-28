// Phosphor icons, the same family kahue.net uses, gathered in a single place so the size and the
// role of each one are decided here and not in each component.
//
// All of them are decorative: what carries the meaning is the text next to them, so they come out with aria-hidden and the
// screen reader does not announce the same thing twice. The import is the server mode one, which renders the SVG
// ready with no client hook, and it is what Next recommends for a server component.
//
// WEIGHT: the icons are FILLED (`weight="fill"`), in place of the thin stroke, and the size and the position of
// each one do not change: the `className` of 16, 20 or 24 px keeps being what decides that. Two exceptions:
//   - the PHONE inside a button or link stays outlined (`IconeTelefoneVazado`): a filled glyph inside a
//     narrow button turns into a blob;
//   - the BRAND of the header (`IconeMarca`) stays outlined because it is not an interface icon: it is the drawing of the
//     identity, and it does not get fat.
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

// Sizes: a 16 px badge accompanies the 14 text; a label and a result of 20 px accompany the body and
// the number; step, notice, quote and the plus and minus buttons of 24 px mark the start of a block and
// stay legible inside a wide button on mobile.
const small = "size-4 shrink-0";
const medium = "size-5 shrink-0";
const large = "size-6 shrink-0";
// The quote went up one step: it is a decorative mark of block opening, and not a label icon, so it
// may go over the 24 px of its neighbors.
const citacao = "size-7 shrink-0";

export const BillIcon = () => <Receipt aria-hidden weight="fill" className={medium} />;
export const CoverageIcon = () => <Gauge aria-hidden weight="fill" className={medium} />;
export const PanelIcon = () => <SolarPanel aria-hidden weight="fill" className={medium} />;
export const MoneyIcon = () => <CurrencyDollar aria-hidden weight="fill" className={medium} />;
export const SavingsIcon = () => <PiggyBank aria-hidden weight="fill" className={medium} />;
export const PaybackIcon = () => <ClockCountdown aria-hidden weight="fill" className={medium} />;
export const HouseIcon = () => <HouseLine aria-hidden weight="fill" className={medium} />;
export const CrewIcon = () => <HardHat aria-hidden weight="fill" className={medium} />;
export const StarIcon = () => <Star aria-hidden weight="fill" className={small} />;
// The reading time clock, in the size of the small text that accompanies it.
export const ClockIcon = () => <Clock aria-hidden weight="fill" className={small} />;
export const NeighborhoodIcon = () => <MapPin aria-hidden weight="fill" className={small} />;
export const PhoneIcon = () => <PhoneCall aria-hidden weight="fill" className={medium} />;
// The phone of the buttons and of the call link, outlined on purpose: see the note at the top.
export const OutlinePhoneIcon = () => <PhoneCall aria-hidden weight="regular" className={medium} />;
// The arrow of the opening button points DOWN, and not to the right, because that is where it leads: the
// destination is the calculator, further down on the same page. A forward arrow on a link that goes down is an icon telling
// another story.
export const ArrowDownIcon = () => <ArrowDown aria-hidden weight="fill" className={medium} />;
export const ArrowUpIcon = () => <ArrowUp aria-hidden weight="fill" className={medium} />;
export const PlusIcon = () => <Plus aria-hidden weight="fill" className={large} />;
export const MinusIcon = () => <Minus aria-hidden weight="fill" className={large} />;
export const DocumentIcon = () => <FileText aria-hidden weight="fill" className={large} />;
export const KeyIcon = () => <Wrench aria-hidden weight="fill" className={large} />;
export const ConnectionIcon = () => <PlugCharging aria-hidden weight="fill" className={large} />;
export const QuoteIcon = () => <Quotes aria-hidden weight="fill" className={citacao} />;
export const WarningIcon = () => <WarningCircle aria-hidden weight="fill" className={medium} />;
export const CalculatorIcon = () => <Calculator aria-hidden weight="fill" className={medium} />;
export const StepsIcon = () => <FlowArrow aria-hidden weight="fill" className={medium} />;
// The blog: an open book with text, at the measure of the other items of the bar. The `FileText` of `IconeDocumento`
// says "document" and lives at a large size, to mark the start of a block; here the role is that of a navigation
// item, so the icon is another one and the size is the same as the four neighbors.
export const BlogIcon = () => <BookOpenText aria-hidden weight="fill" className={medium} />;
export const BrandIcon = () => <Sun aria-hidden className={large} />;
export const InfoIcon = () => <Info aria-hidden weight="fill" className={medium} />;
