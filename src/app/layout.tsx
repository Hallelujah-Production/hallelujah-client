import type { Metadata, Viewport } from "next";
import { Great_Vibes, IBM_Plex_Sans, Inter } from "next/font/google";
import { PLATFORM_NAME, PLATFORM_SITE_URL } from "@/lib/brand";
import { FeedbackProvider } from "@/components/feedback/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  variable: "--font-display",
});

const script = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-script",
});

const SITE_URL = PLATFORM_SITE_URL;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${PLATFORM_NAME} — Prayer intentions for your church`,
    template: `%s | ${PLATFORM_NAME}`,
  },
  description:
    "A simple and trusted way to submit prayer intentions and connect them with your church community. Offerings are recorded by the church itself — no online payment gateway.",
  applicationName: PLATFORM_NAME,
  keywords: [
    "prayer intentions",
    "church prayer requests",
    "mass intentions",
    "parish management",
    "church receipts",
  ],
  authors: [{ name: PLATFORM_NAME }],
  openGraph: {
    type: "website",
    siteName: PLATFORM_NAME,
    locale: "en_IN",
    url: SITE_URL,
    title: `${PLATFORM_NAME} — Prayer intentions for your church`,
    description:
      "Find your church, submit a prayer intention and receive an official receipt.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${PLATFORM_NAME} — Prayer intentions for your church`,
    description:
      "Find your church, submit a prayer intention and receive an official receipt.",
  },
  // Canonical URLs are declared per public page; private pages carry none.
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#12233d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${plex.variable} ${script.variable}`}>
      <body className="min-h-dvh min-h-screen bg-background font-sans text-foreground">
        <a
          href="#main-content"
          data-print="hide"
          className="sr-only left-4 top-4 z-[100] rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:absolute"
        >
          Skip to main content
        </a>
        <FeedbackProvider>{children}</FeedbackProvider>
      </body>
    </html>
  );
}
