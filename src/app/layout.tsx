import type { Metadata } from "next";
import { Geist_Mono, Golos_Text, Unbounded } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Golos Text: Latin Extended (Azerbaijani ə/ğ/ı/ö/ş/ü/ç) plus Cyrillic in
// one family, since store names and descriptions come from real Baku owners
// in either script. Body/UI voice throughout.
const bodyFont = Golos_Text({
  variable: "--font-body",
  subsets: ["latin", "latin-ext", "cyrillic"],
});

// Unbounded: geometric, faceted, squared terminals — display voice only
// (page titles, store names, category labels), echoing the woven-register
// world's grid logic instead of a soft display serif.
const displayFont = Unbounded({
  variable: "--font-display",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["500", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Schedule.az, booking for Baku's service businesses",
  description:
    "Book barbershops, salons and spas in Baku with confirmed appointments, no more WhatsApp mixups.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${displayFont.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/*
          THESIS: The directory is a woven register, not a card grid — every
          business occupies one framed panel in a continuous field, refusing
          the Yelp/Google-Maps list-of-shadow-cards default.
          OWN-WORLD: Ivory wool ground, madder-red primary, hairline
          guard-bands (not shadows) in rotating carpet-dye category colors;
          Unbounded display, Golos Text body, Geist Mono for data.
          STORY: A visitor recognizes real businesses by photo, name, and
          category at a glance, the way you'd scan storefronts on a street,
          and picks one to book with confidence.
          FIRST VIEWPORT: Search bar, then a woven grid of guard-banded store
          panels with cycling photo carousels; primary booking CTA sits
          inside each panel, never floating chrome.
          FORM: The Carpet Register (Azerbaijani carpet medallion grids),
          direction 5 of 7, seed key 5386f9ec.
          FINISH: unreviewed and undocumented is unfinished; this build ends
          with the finish review, the verdict, DESIGN.md, and every shipping
          raster carrying its provenance.
        */}
        {children}
        <Toaster />
      </body>
    </html>
  );
}
