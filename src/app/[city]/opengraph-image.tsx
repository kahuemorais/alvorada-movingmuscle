import { ImageResponse } from "next/og";
import { getCity } from "@/lib/city";
import { usd } from "@/lib/format";
import { palette } from "@/lib/palette";
import { simulate } from "@/lib/solar";

// Share card: almost nobody decides alone, and the address is sent by message to whoever
// decides together. So the card shows the two numbers that
// that person will look at before opening the link, panels and savings, at the starting point of the simulator.
//
// No font of its own: ImageResponse uses the system font, and loading a .ttf just for the card
// would cost more weight than the typographic consistency gained here.
export const alt = "Solar estimate for a city served by Brightfield Solar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// The card is the same for every visit of that city, so it is generated at build time together with the page,
// instead of becoming a function that answers on demand (which would add a cold start right when the
// messenger crawler fetches the image).
export const dynamic = "force-static";

export default async function Image({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const data = getCity(city);
  const result = simulate(data, { bill: 220, coverage: 80 });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: palette.canvas,
          color: palette.ink,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 24, letterSpacing: 1, color: palette.support, textTransform: "uppercase" }}>
            Brightfield Solar
          </div>
          {/* One interpolated string, and not three child nodes: every satori div has to declare
              display when it has more than one child, and the title text carries city and state. */}
          <div style={{ fontSize: 57, fontWeight: 700, lineHeight: 1.05, marginTop: 24, maxWidth: 940 }}>
            {`Solar in ${data.city}, ${data.state}`}
          </div>
        </div>

        <div style={{ display: "flex", gap: 64, alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 24, color: palette.support }}>Panels</div>
            <div style={{ fontSize: 45, fontWeight: 700 }}>{String(result.panels)}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 24, color: palette.support }}>Monthly savings</div>
            <div style={{ fontSize: 45, fontWeight: 700, color: palette.savings }}>
              {usd(result.monthlySavings)}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 24, color: palette.support }}>Installs completed</div>
            <div style={{ fontSize: 45, fontWeight: 700 }}>{String(data.installsCompleted)}</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
