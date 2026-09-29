"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Reveal } from "@/components/Reveal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import {
  WarningIcon,
  CalculatorIcon,
  HouseIcon,
  CoverageIcon,
  BillIcon,
  ArrowDownIcon,
  MoneyIcon,
  SavingsIcon,
  InfoIcon,
  PlusIcon,
  MinusIcon,
  PanelIcon,
  PaybackIcon,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { trackSimulationCompleted, trackSimulationStarted } from "@/lib/analytics";
import type { City } from "@/lib/city";
import { years, num, percent, percentFull, usd, usdRedondo } from "@/lib/format";
import { simulate } from "@/lib/solar";

const BILL_MIN = 40;
const BILL_MAX = 600;
const BILL_STEP = 10;
// The coverage goes from 50 to 100 percent, in steps of five points. Before, the page offered three points
// (50, 80 and 100), which did not serve the grid, although the three values keep being valid.
const COVERAGE_MIN = 50;
const COVERAGE_MAX = 100;
const COVERAGE_STEP = 5;

// The three named points keep existing, now as a shortcut: they are where the sentence that explains the
// consequence of each choice range lives.
const COVERAGE_OPTIONS = [
  { value: 50, label: "Half", note: "a smaller system, the lowest price" },
  { value: 80, label: "Most", note: "what most homes here choose" },
  { value: 100, label: "All", note: "the extra becomes bill credit, not payment" },
] as const;

const isValidCoverage = (value: number) =>
  Number.isFinite(value) &&
  value >= COVERAGE_MIN &&
  value <= COVERAGE_MAX &&
  value % COVERAGE_STEP === 0;

// The consequence sentence exists for the three named points. For a value in between, the sentence of the closest
// point holds: inventing one sentence per value would state what nobody wrote, and saying nothing would be
// worse than saying the closest one.
const nearestPoint = (value: number) =>
  COVERAGE_OPTIONS.reduce((a, b) => (Math.abs(b.value - value) < Math.abs(a.value - value) ? b : a));
// It is the initial state of the reference table, not a lock.
const DEFAULT_BILL = 220;
const DEFAULT_COVERAGE = 80;

type State = { bill: number; coverage: number };

// The state lives in the query string because the address is sent by message to whoever decides together:
// whoever receives the link has to open the SAME simulation, not the blank page.
//
// The URL is read with useSyncExternalStore, and not with state copied into React. Two reasons.
// The first is the shared link: with copied state, reading the URL in the mount effect and writing
// the URL in another effect dispute the same cycle, and in React strict mode the effects run
// twice, so the write erased the read and the link opened at the default. The second is that here there is no
// parallel state to synchronize: the simulation IS the URL, and changing the control writes the URL.
function subscribe(notify: () => void) {
  window.addEventListener("popstate", notify);
  window.addEventListener(URL_EVENT, notify);
  return () => {
    window.removeEventListener("popstate", notify);
    window.removeEventListener(URL_EVENT, notify);
  };
}

function readSearch(): string {
  return window.location.search;
}

// On the server and at hydration there is no URL: it returns empty, which is the default. After hydrating,
// React reads the search for real and already shows the simulation of the link, with no divergence warning.
function readSearchOnServer(): string {
  return "";
}

function stateFromSearch(search: string): State | null {
  const params = new URLSearchParams(search);
  const bill = Number(params.get("bill"));
  const coverage = Number(params.get("coverage"));
  if (!params.has("bill") || !params.has("coverage")) return null;
  if (!Number.isFinite(bill) || !Number.isFinite(coverage)) return null;
  if (bill < BILL_MIN || bill > BILL_MAX) return null;
  if (!isValidCoverage(coverage)) return null;
  return { bill, coverage };
}

const URL_EVENT = "brightfield:url";

const DEFAULT: State = { bill: DEFAULT_BILL, coverage: DEFAULT_COVERAGE };

export default function Simulator({ city }: { city: City }) {
  const search = useSyncExternalStore(subscribe, readSearch, readSearchOnServer);
  // The campaign lives in the search of the FIRST visit, and the simulator rewrites the URL at every adjustment (`replaceState`
  // with bill and coverage), which erases the tags. Read at the moment of the event, they no longer exist: the event
  // arrived at the media team without knowing WHICH ad generated the simulation, which is exactly what this module
  // exists to answer. That is why the campaign search is captured once, in the first render, before
  // any write, and it is what goes to the two events.
  const [campaignSearch] = useState(() => (typeof window === "undefined" ? "" : window.location.search));
  const [profile, setProfile] = useState<string | null>(null);

  const state = useMemo(() => stateFromSearch(search) ?? DEFAULT, [search]);
  const result = useMemo(() => simulate(city, state), [city, state]);

  // The initial state is the one of the reference table, $220 with 80% coverage, and $220 is the typical bill
  // of the "Three-bedroom house, no pool". That is the card that starts marked, and not the first of the list (the $90 bill) nor
  // any other. The marking is DERIVED from the state, and not a `useState` with the index: that way the right card lights
  // up also when someone opens a shared link that brings exactly $220 / 80%, and no card lights up
  // when the link brings another state (the simulation is of the link, not of a profile). Clicking a card fixes the choice in
  // `profile` and it survives changing the bill afterwards.
  const activeProfile = useMemo(() => {
    if (profile !== null) return profile;
    if (state.bill !== DEFAULT_BILL || state.coverage !== DEFAULT_COVERAGE) return null;
    const index = city.householdProfiles.findIndex((item) => item.typicalBill === DEFAULT_BILL);
    return index >= 0 ? String(index) : null;
    // `profile` and `state` are the two inputs; `city` changes the label of the card, not the typical bill.
  }, [profile, state, city]);

  // Writes the URL and notifies whoever is reading, which is the page itself. `replaceState` instead of the
  // router: the page is static, there is no navigation to register, and without that every drag of the control
  // would enter the browser history.
  const apply = (next: State, nextProfile: string | null) => {
    const params = new URLSearchParams({ bill: String(next.bill), coverage: String(next.coverage) });
    window.history.replaceState(null, "", `?${params.toString()}`);
    window.dispatchEvent(new Event(URL_EVENT));
    setProfile(nextProfile);
  };

  // Simulation event, fired after the person stops moving: without the wait, every step of the
  // control would become a simulation in the media team report and the number would lose meaning.
  const firstRound = useRef(true);
  const started = useRef(false);

  useEffect(() => {
    if (firstRound.current) {
      firstRound.current = false;
      return;
    }
    if (!started.current) {
      started.current = true;
      // The ACTIVE profile goes, and not only the one that was clicked: with the initial state already being a profile of the table,
      // the event of the first adjustment would say "none" while the screen shows the three-bedroom card marked.
      trackSimulationStarted(campaignSearch, activeProfile);
    }
    const timer = setTimeout(() => {
      trackSimulationCompleted(result, state, campaignSearch, activeProfile);
    }, 1000);
    return () => clearTimeout(timer);
    // `buscaDaCampanha` stays in the list because it is read inside here and never changes after the first render: the
    // effect keeps firing for the same three reasons, but the lint warning does not stand.
  }, [state, profile, activeProfile, result, campaignSearch]);

  // Draft of the bill field: while the person types, the text lives here and not in the URL, otherwise
  // typing 4 of 430 would become 40 in the middle of the typing. The draft is only the text being edited; the simulation
  // keeps being the URL, and it is discarded when leaving the field.
  const [draft, setDraft] = useState<string | null>(null);

  const setBill = (value: number) => {
    const clamped = Math.min(BILL_MAX, Math.max(BILL_MIN, value));
    apply({ ...state, bill: Math.round(clamped / BILL_STEP) * BILL_STEP }, profile);
  };

  const commitDraft = () => {
    if (draft === null) return;
    const number = Number(draft.replace(/[^0-9]/g, ""));
    setDraft(null);
    if (Number.isFinite(number) && number > 0) setBill(number);
  };

  const chooseProfile = (index: string) => {
    // The card fills the typical bill of that profile and does not touch the coverage.
    //
    // Before, it also returned the coverage to the default of 80, to close the fourth line of the acceptance
    // table. It is not a requirement: the test of the table (`src/lib/acceptance.test.ts`) runs by state, with
    // bill and coverage passed straight to the calculation, and it passes with or without the reset. It was an interface decision, and
    // it discarded in silence a choice of whoever was using the page: with 50% marked, touching a card
    // returned 80 with no explanation.
    apply({ ...state, bill: city.householdProfiles[Number(index)].typicalBill }, index);
  };

  // What is left of the bill after the savings. The savings never goes over the bill (rule 3, in `src/lib/solar.ts`), so
  // the final bill never goes negative, and the number is arithmetic of the simulation itself, not new data.
  const finalBill = state.bill - result.monthlySavings;

  // The six bills the page explains, in order, each one with the number this city already brings. They live as data,
  // and not as six hand-written paragraphs, for two reasons: the term of the row is the same one that opens the sentence, and
  // the numbering comes from the POSITION, never from a counter that adds up at render time. No value is new: all of them come from
  // `simulate()` or from the city file.
  const bills = [
    {
      term: "Usage",
      text: `${usd(state.bill)} a month at ${usd(city.utilityRatePerKwh)} per kWh is ${num(result.monthlyUsageKwh)} kWh.`,
    },
    {
      term: "Target",
      text: `${percent(state.coverage)} of that, or ${num(result.targetKwh)} kWh.`,
    },
    {
      term: "One panel",
      text: `${num(city.panelWatts)} W at ${city.peakSunHoursPerDay} peak sun hours a day and a ${city.performanceRatio} performance factor makes ${num(result.panelGenerationKwh)} kWh a month.`,
    },
    {
      term: "Panels",
      // Two steps, and the sentence says both: the ceiling of the raw number and, after, the floor of the city. Before it used
      // the final number in place of the ceiling and said that the floor was below it, which contradicts the calculation.
      text:
        `${num(result.panelsRaw)} of them, and a panel is a whole unit, so that is ${num(Math.ceil(result.panelsRaw))}.` +
        (result.flags.minPanelsApplied
          ? ` ${city.city} also sets a minimum of ${num(city.minPanels)} panels per installation, and that floor is above the rounded number, so the smallest system here is ${num(result.panels)}.`
          : ""),
    },
    {
      term: "Price",
      text: `${num(result.panels)} panels at ${num(city.panelWatts)} W and ${usd(city.costPerWattInstalled)} per watt installed is ${usd(result.investmentGross)}. The ${percentFull(city.federalCreditRate)} federal credit takes it to ${usd(result.investmentAfterCredit)}.`,
    },
    {
      term: "Savings",
      text:
        `${num(result.generationKwh)} kWh a month is ${usd(result.rawGenerationValue)} of electricity. ` +
        (result.flags.savingsCapped
          ? `Your bill is the ceiling, so savings stop at ${usd(result.monthlySavings)}.`
          : "All of it comes off your bill.") +
        ` Payback: ${usd(result.investmentAfterCredit)} over twelve months of savings is ${years(result.paybackYears)}.`,
    },
  ];

  return (
    // Band 1: the background of the page (`canvas`). The section came to be the band (window width, its own vertical
    // padding) and the content lives in the 64 rem column inside it, which is the arrangement of the opening. The `pb` of the
    // mobile reserves the height of the fixed bar plus the safe area, as in the previous round; from the medium size
    // up the bar rises to the top and the padding goes back to being the 64 step.
    <section
      id="simulator"
      aria-labelledby="simulator-title"
      className="w-full bg-canvas py-xxl pb-[calc(var(--spacing-xxl)_+_env(safe-area-inset-bottom))] sm:pb-xxl"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-lg px-lg">
      <header className="flex flex-col gap-sm">
        {/* Eyebrow in the language of the other sections (rule and short label), with a job: the calculator is the
            product of the page, and it is this line that separates it from the rest, the same way the three steps and the
            social proof already present themselves. */}
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
          {/* Profiles first because most people do not know the bill at that moment, and the fastest path becomes the
              first of the column. The field
              stays editable right below,
              with the coverage in the step after, and choosing a card only swaps the bill: the coverage does not go back to the
              default (see `escolherPerfil`).

              One card per profile, and not a row with a dot: the label of these profiles has two
              pieces of information (the type of house and the typical bill) and in a single row the second one vanishes. The whole
              card is the clickable area, which gives a 48 px target without squeezing the drawing, and the chosen one
              gains the border in the action color, which is the only decision color of the page. */}
          <fieldset className="flex flex-col gap-md">
            {/* The title of the block lost the "Or" when the profiles went up to the top of the column: the "Or" was from the old
                order, in which this block was the second option after the bill field. Now it OPENS the column, so
                the conjunction was left over and the label goes back to being a direct invite. The lead of the section stays as it was. */}
            <legend className="mb-md flex items-center gap-sm type-label text-ink">
              <span className="text-primary-dark">
                <HouseIcon />
              </span>
              Start from a home like yours
            </legend>
            {/* A shortcut, and not a form: the four cards with a radio dot looked like a form, and the chosen
                state was weak. The dot left, the whole card became clickable and
                the chosen one comes to be marked by the border and the ring of the action color (`aria-pressed`), which is the
                same resource the Half, Most and All shortcuts already use one step above. The accessible name keeps
                being the profile label with the typical bill, and the state goes in `aria-pressed`, so the screen
                reader hears the same as before. */}
            <div className="grid gap-sm sm:grid-cols-2">
              {city.householdProfiles.map((item, index) => (
                // Background of its own in the chosen one (`bg-canvas`), beyond the border and the ring: the border alone marked the
                // card, but the chosen one kept the same white surface as the other three, and reading the
                // state at first glance is what is wanted here. The pair is the one of the rest of the page (canvas behind, surface
                // in front), and not the full action ink: full ink in a card of two lines of text would become a
                // button, and the border of the action color already says that it is the chosen one.
                <button
                  key={item.label}
                  type="button"
                  data-profile={index}
                  aria-pressed={activeProfile === String(index)}
                  onClick={() => chooseProfile(String(index))}
                  className="flex min-h-touch flex-col gap-xs rounded-md border border-outline bg-surface p-md text-left transition-colors hover:border-ink/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink aria-pressed:border-primary aria-pressed:bg-canvas aria-pressed:ring-1 aria-pressed:ring-primary"
                >
                  <span className="type-body text-ink">{item.label}</span>
                  <span className="microcopy">About {usdRedondo(item.typicalBill)} a month</span>
                </button>
              ))}
            </div>
          </fieldset>

          {/* The border of the field and of the control used is the outline color, and not a light gray: Material
              asks for 3 to 1 contrast in a component limit, and ink at 15% measures 1,37, which identifies
              nothing. With the token `outline` it measures 3,96 over white and 3,66 over the background of the page. */}
          {/* Field with a step on each side, in place of the slider: whoever knows the power bill
              knows the number, not the position of a button on a bar. The two buttons cover the fine adjustment
              and the field accepts the exact value. */}
          <div className="flex flex-col gap-sm">
            <label htmlFor="bill" className="flex items-center gap-sm type-label text-ink">
              <span className="text-primary-dark">
                <BillIcon />
              </span>
              Average monthly electric bill
            </label>
            {/* A single box, with the width of the column, with the two steps inside. Before the bill box had
                144 px because of a width limit nobody asked for and the buttons stayed on the
                outside, so the simulator showed four controls with three different widths: the bill, the
                coverage cursor, the shortcuts and the profile cards. */}
            <div className="flex min-h-touch items-center gap-xs rounded-lg border border-outline bg-surface px-xs focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                className="min-h-touch min-w-touch shrink-0"
                aria-label={`Lower the bill by ${usdRedondo(BILL_STEP)}`}
                onClick={() => setBill(state.bill - BILL_STEP)}
              >
                <MinusIcon />
              </Button>
              <span aria-hidden className="microcopy">
                $
              </span>
                <input
                  id="bill"
                  type="number"
                  inputMode="decimal"
                  min={BILL_MIN}
                  max={BILL_MAX}
                  step={BILL_STEP}
                  value={draft ?? state.bill}
                  aria-describedby="bill-hint"
                  onChange={(event) => setDraft(event.target.value)}
                  onBlur={commitDraft}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      commitDraft();
                      event.currentTarget.blur();
                    }
                  }}
                  className="h-full min-w-0 flex-1 bg-transparent px-xs type-lead text-ink tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                className="min-h-touch min-w-touch shrink-0"
                aria-label={`Raise the bill by ${usdRedondo(BILL_STEP)}`}
                onClick={() => setBill(state.bill + BILL_STEP)}
              >
                <PlusIcon />
              </Button>
            </div>
            <p id="bill-hint" className="microcopy">
              Between {usdRedondo(BILL_MIN)} and {usdRedondo(BILL_MAX)}, in steps of {usdRedondo(BILL_STEP)}.
            </p>
          </div>

          <fieldset className="flex flex-col gap-md">
            <legend className="mb-md flex items-center gap-sm type-label text-ink">
              <span className="text-primary-dark">
                <CoverageIcon />
              </span>
              Share of your usage you want to cover
            </legend>
            {/* Cursor in steps of five, with the value always visible next to it. The slider was
                refused here when the choice was of three paths, because it hid the number; with the value
                in the row above it hides nothing, and it is the only control that gives the grid the document
                asks for without becoming eleven cards. */}
            <div className="flex min-h-touch items-center gap-md rounded-lg border border-outline bg-surface px-md">
              <span className="type-lead tabular-nums text-ink">{percent(state.coverage)}</span>
              <input
                type="range"
                min={COVERAGE_MIN}
                max={COVERAGE_MAX}
                step={COVERAGE_STEP}
                value={state.coverage}
                aria-label="Share of your usage you want to cover"
                aria-valuetext={`${percent(state.coverage)} of your usage`}
                onChange={(event) =>
                  apply({ ...state, coverage: Number(event.target.value) }, profile)
                }
                className="h-touch flex-1 accent-primary"
              />
            </div>
            {/* The three named points, as a shortcut: they are where the sentence that explains each range lives. */}
            <div className="flex flex-wrap gap-xs">
              {COVERAGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => apply({ ...state, coverage: option.value }, profile)}
                  aria-pressed={state.coverage === option.value}
                  className="min-h-touch flex-1 rounded-sm border border-outline px-md type-label text-ink transition-colors hover:bg-canvas aria-pressed:border-primary aria-pressed:ring-1 aria-pressed:ring-primary"
                >
                  {option.label} · <span className="tabular-nums">{percent(option.value)}</span>
                </button>
              ))}
            </div>
            {/* The consequence of the choice, in one line, with the sentence of the closest named point. */}
            <p className="microcopy">
              {nearestPoint(state.coverage).label} of your usage:{" "}
              {nearestPoint(state.coverage).note}. Extra power goes to {city.utilityName} as bill
              credit.
            </p>
          </fieldset>

        </div>

        {/* The result stopped being four numbers of the same size: the savings leads, which is the question
            the page promises to answer, and the other three become bill rows, with a label on
            one side and a value on the other, separated by a 1 px hairline. Before the four were in the same step of
            48 px and nothing said which of them was the answer. */}
        <Card className="h-fit">
          <CardContent className="flex flex-col gap-lg py-6">
            <p className="flex items-center gap-sm type-label text-support">
              <span aria-hidden className="h-px w-xl bg-support" />
              Your estimate
            </p>

            {/* aria-live: the number changes while the person drags, so the screen reader needs to be
                notified without the focus leaving the control. */}
            <output aria-live="polite" className="flex flex-col gap-lg">
              {/* The savings block, in the number step and with the sentence that says what the bill ends up at. The amber
                  rule that crossed the column above the label has left: with it the block had two openings (the
                  rule and the label) and the value lost its place as the start of the poster. */}
              <div className="flex flex-col gap-sm">
                <p className="flex items-center gap-sm type-label text-support">
                  <span className="text-primary-dark">
                    <SavingsIcon />
                  </span>
                  Monthly savings
                </p>
                <Valor text={usdRedondo(result.monthlySavings)} className="type-number savings tabular-nums" />
                <p className="type-body text-support max-w-measure">
                  On a {usdRedondo(state.bill)} bill with {percent(state.coverage)} of your usage
                  covered. Your bill goes to about {usdRedondo(finalBill)} a month.
                </p>
              </div>

              {/* One row for the panels and a row of two for cost and return: they are the three check
                  bills, and the last two stay side by side, instead of stacked. */}
              <div className="flex flex-wrap items-baseline justify-between gap-x-md gap-y-xs border-t border-border py-md">
                <p className="flex items-center gap-sm type-label text-support">
                  <span className="text-primary-dark">
                    <PanelIcon />
                  </span>
                  Panels
                </p>
                <Valor text={num(result.panels)} className="type-lead text-ink tabular-nums" />
              </div>

              <div className="grid grid-cols-2 gap-md border-t border-border pt-md">
                <div className="flex flex-col gap-xs">
                  <p className="flex items-center gap-sm type-label text-support">
                    <span className="text-primary-dark">
                      <MoneyIcon />
                    </span>
                    Cost after the {percentFull(city.federalCreditRate)} federal credit
                  </p>
                  <Valor
                    text={usdRedondo(result.investmentAfterCredit)}
                    className="type-lead text-ink tabular-nums"
                  />
                </div>
                <div className="flex flex-col gap-xs">
                  <p className="flex items-center gap-sm type-label text-support">
                    <span className="text-primary-dark">
                      <PaybackIcon />
                    </span>
                    Years to payback
                  </p>
                  <Valor text={years(result.paybackYears)} className="type-lead text-ink tabular-nums" />
                </div>
              </div>
            </output>

            {result.flags.minPanelsApplied ? (
              <Alert>
                <WarningIcon />
                <AlertTitle>Why more panels than you asked for</AlertTitle>
                <AlertDescription>
                  Your usage would need {num(Math.ceil(result.panelsRaw))} panels. A panel is a whole
                  unit and every installation in {city.city} has a minimum of {num(city.minPanels)}, so
                  the smallest system you can order is {num(city.minPanels)} panels. That is why the
                  price does not drop below {usdRedondo(result.investmentAfterCredit)}.
                </AlertDescription>
              </Alert>
            ) : null}

            {result.flags.savingsCapped ? (
              <Alert>
                <InfoIcon />
                <AlertTitle>Your system would generate more than you use</AlertTitle>
                <AlertDescription>
                  These panels would produce {usd(result.flags.generationValue)} of electricity a
                  month, above your {usd(state.bill)} bill. The extra{" "}
                  {usd(result.flags.surplusValue)} goes to {city.utilityName} as credit against future
                  bills, and credit never turns into a payment, so your savings stop at the size of your bill.
                </AlertDescription>
              </Alert>
            ) : null}

          </CardContent>
        </Card>
      </div>

      {/* The explanation of the value and the estimate notice are ONE single block, below the lining, and not two cards nor
          content inside the result card. The path to here: inside the card the three blocks stayed
          glued, and two cards side by side were still too much content. What stayed: a box, the six bills in numbered rows (two
          columns on the desktop) with the term in ink and the sentence in support, and the notice closing the block. What the notice
          repeated from the bills left it: the rate and the sun hours are in bill 1 and in 3, and the federal credit in
          5. The block enters the scroll like the other sections, and the rows arrive staggered at 60 in 60 ms, which is the
          same resource of the cards of the three steps. */}
      <Reveal>
        <div
          id="how-we-calculate"
          className="flex flex-col gap-md rounded-lg border border-outline bg-surface p-lg"
        >
          <h3 className="flex items-center gap-sm type-lead text-ink">
            <span className="text-primary-dark">
              <CalculatorIcon />
            </span>
            How this estimate is built
          </h3>
          <p className="type-body text-support max-w-measure">
            Six counts, in this order, with the numbers {city.city} runs on.
          </p>
          {/* Light numbering: the number lives in an outline tag over the background of the page, and not in a dark badge.
              Numbering is orientation, not emphasis, and it is the same rule the blog follows. The `role="list"` is what gives the list semantics back to the screen reader when the
              browser marking leaves the scene (`list-none`), since the visible number is decoration. */}
          <ol role="list" className="grid list-none gap-md gap-x-xl md:grid-cols-2">
            {bills.map((bill, index) => (
              <li
                key={bill.term}
                className="stagger flex items-start gap-sm"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <span
                  aria-hidden
                  className="flex size-5 shrink-0 items-center justify-center rounded-sm border border-outline bg-canvas type-label text-ink tabular-nums"
                >
                  {index + 1}
                </span>
                <span className="flex flex-col gap-xs">
                  <span className="type-label text-ink">{bill.term}</span>
                  <span className="type-body text-support">{bill.text}</span>
                </span>
              </li>
            ))}
          </ol>
          <div id="estimate-warning" className="flex flex-col gap-sm border-t border-border pt-md">
            <h3 className="flex items-center gap-sm type-label text-ink">
              <span className="text-primary-dark">
                <InfoIcon />
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
      </Reveal>

      {/* The middle call, with the number the person has just seen. Measured before: between 15% and 97% of the height
          of the page there was no action, which is what makes whoever is on mobile give up in the middle.
          The block was faded, and the emphasis is the same resource the project already uses in the featured
          testimonial: action color ink at 25%, which is the measured level that does not read as white paper, with a border of the
          same color. The button becomes the dark one here, because a button of the action color over a background of the action color
          disappears.
          The action stopped being the call and became the invite that continues the simulation, without asking for a phone
          or email before the person shows interest. The phone stays one tap away in the opening, in the close
          and in the bar. */}
      <div
        id="middle-cta"
        className="flex flex-col gap-md rounded-lg border border-primary bg-primary/25 p-lg md:flex-row md:items-center md:justify-between"
      >
        <div className="flex flex-col gap-sm">
          {/* Eyebrow with a rule, the same resource of the sections. */}
          <p className="flex items-center gap-sm type-label text-ink">
            <span aria-hidden className="h-px w-xl bg-ink/60" />
            Next step
          </p>
          <p className="type-lead text-ink">Want to see what your actual roof could look like?</p>
          {/* The numbers of the simulation stay in the block: it was the most important information of it and it was
              dissolved in the middle of the sentence. */}
          <p className="type-body max-w-measure text-ink/90">
            On your {usdRedondo(state.bill)} bill with {percent(state.coverage)} covered, the estimate
            is {num(result.panels)} panels and {usdRedondo(result.monthlySavings)} back every month. The site
            visit measures the roof, checks the layout against your own usage and confirms the price
            before anything is signed. It costs nothing, and you do not leave a phone number or an email
            to ask for it.
          </p>
        </div>
        <Button asChild size="lg" className="w-full shrink-0 md:w-auto">
          <a href="#book">
            Book the site visit
            <ArrowDownIcon />
          </a>
        </Button>
      </div>
      </div>
    </section>
  );
}

// The number that has just changed gives a short pulse. Here motion is not an ornament: it is what says WHICH of the four
// numbers answered what the person changed, which is the rule of the house for animation: show cause and effect.
// No React state: the class enters and leaves through the element itself, and the global `prefers-reduced-motion` already
// reduces the animation to nothing for whoever asked for less motion.
function Valor({ text, className }: { text: string; className: string }) {
  const target = useRef<HTMLParagraphElement>(null);
  const previous = useRef(text);

  useEffect(() => {
    const el = target.current;
    if (!el || previous.current === text) return;
    previous.current = text;
    el.classList.remove("pulsed");
    void el.offsetWidth;
    el.classList.add("pulsed");
    const end = () => el.classList.remove("pulsed");
    el.addEventListener("animationend", end, { once: true });
    return () => el.removeEventListener("animationend", end);
  }, [text]);

  return (
    <p ref={target} className={className}>
      {text}
    </p>
  );
}
