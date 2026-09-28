// Formatting in the United States standard, because the page serves the American homeowner. The
// Intl does the work: currency with a thousands separator and two decimals, integer with thousands.
//
// The not-finite number guard is the second layer, and not the first: the city schema already blocks invalid
// data at the entrance. It exists because the failure mode is known: a city with a zero rate
// yielding "infinity, $NaN, NaN years" on the screen: failing the build is always better than publishing a number
// that is broken, and the message says which formatter received the value, so the build points at the place.
const usdFmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
// The round dollar needs its own formatter, and not a `round` before the full formatter: `Intl` with
// `style: currency` always writes the cents, so `usdRedondo(179)` came out "$179.00" and the number still had
// the look of a bank statement. It was the test that showed it, not a reading of the code.
const usdIntegerFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const numFmt = new Intl.NumberFormat("en-US");

function finite(value: number, formatter: string): number {
  if (!Number.isFinite(value)) {
    throw new Error(`${formatter} received a number that is not finite: ${String(value)}`);
  }
  return value;
}

export const usd = (n: number) => usdFmt.format(finite(n, "usd"));

// The highlighted number reads as a tool, and the cent is a bank statement thing: "$179.01" on the
// result card and "1.466,67 kWh" in the detailed bill live together well, because the
// second is where the person checks the arithmetic; the highlight asks for the round value. The rounding is ONLY for
// presentation: `simulate()` still returns the cent, and it is what the list of bills shows.
export const usdRedondo = (n: number) => usdIntegerFmt.format(Math.round(finite(n, "usdRedondo")));
export const num = (n: number) => numFmt.format(finite(n, "num"));
export const years = (n: number) => `${finite(n, "years").toFixed(1)} years`;
export const percent = (n: number) => `${numFmt.format(finite(n, "percent"))}%`;

// Rate stored as a fraction in the city file (0,3) becoming the label the person reads (30%). It exists
// as a function because the simulator label and the metadata description need the same number, and because
// before, that 30 was written by hand in both places: data that changes with a fixed label is a label that lies.
// Rating score, always with one decimal: the data brings 5 and 4.9, and without a formatter the line mixes the two
// scales ("5" next to "4.9").
export const note = (value: number) => finite(value, "note").toFixed(1);

export const percentFull = (fraction: number) =>
  `${numFmt.format(Math.round(finite(fraction, "percentFull") * 100))}%`;
