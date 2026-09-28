import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Archivo } from "next/font/google";
import { siteUrl } from "@/lib/urls";
import "./globals.css";

// Single typeface, decided in DESIGN.md: Archivo is a robust grotesque, with tabular numerals, and not the Inter that every
// interface generator uses. `variable` publishes the name that globals.css uses in --font-sans.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  // Base address for Next to build the absolute address of the share image. Without this it
  // warns at build time and falls back to localhost, which would break the image when the link was shared.
  metadataBase: new URL(siteUrl()),
  title: "Brightfield Solar",
  description:
    "Residential solar in the Southwest. See what a system costs in your city, what you save every month and when it pays for itself.",
};

// `viewportFit: cover` makes env(safe-area-inset-bottom) really count on the iPhone, which is where
// the navigation bar floats in the footer.
export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
