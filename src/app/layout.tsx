import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Archivo } from "next/font/google";
import { siteUrl } from "@/lib/urls";
import "./globals.css";

// Fonte única, decidida no DESIGN.md: Archivo é grotesco robusto, de numeral tabular, e não a Inter que todo
// gerador de interface usa. `variable` publica o nome que o globals.css usa em --font-sans.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  // Endereco base para o Next montar endereco absoluto de imagem de compartilhamento. Sem isso ele
  // avisa no build e cai em localhost, o que quebraria a imagem quando o link fosse compartilhado.
  metadataBase: new URL(siteUrl()),
  title: "Brightfield Solar",
  description:
    "Residential solar in the Southwest. See what a system costs in your city, what you save every month and when it pays for itself.",
};

// `viewportFit: cover` deixa o env(safe-area-inset-bottom) valer de verdade no iPhone, que é de onde
// a barra de navegação flutua no rodapé.
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
