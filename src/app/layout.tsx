import type { Metadata } from "next";
import { Suspense } from "react";
import { DM_Mono, DM_Sans, Golos_Text, Instrument_Serif } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const sansFont = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin", "latin-ext"],
});

// DM Sans has no Cyrillic. Golos Text is listed after it so Cyrillic store
// names and descriptions from Baku owners still render in a matching sans
// instead of the OS default; its unicode-range keeps it from loading for
// Latin-only pages.
const cyrillicFallback = Golos_Text({
  variable: "--font-golos",
  subsets: ["cyrillic"],
});

const displayFont = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  weight: "400",
  style: ["normal", "italic"],
});

const monoFont = DM_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://schedule.az";
const TITLE = "Schedule.az, booking for Baku's service businesses";
const DESCRIPTION =
  "Book barbershops, salons, spas and other service businesses in Baku with a confirmed appointment, no more WhatsApp back and forth.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s | Schedule.az" },
  description: DESCRIPTION,
  keywords: [
    "Baku booking", "barbershop Baku", "salon Baku", "appointment booking Azerbaijan",
    "spa booking Baku", "online booking Azerbaijan",
  ],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    siteName: "Schedule.az",
    type: "website",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${sansFont.variable} ${cyrillicFallback.variable} ${displayFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <SiteFooter />
        <Suspense fallback={null}>
          <MobileTabBar />
        </Suspense>
        <Toaster />
      </body>
    </html>
  );
}
