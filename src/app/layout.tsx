import type { Metadata } from "next";
import Script from "next/script";
import { Onest, JetBrains_Mono, Pixelify_Sans } from "next/font/google";
import PikorafyNavbar from "@/components/PikorafyNavbar";
import Footer from "@/components/Footer";
import HideOnAdmin from "@/components/HideOnAdmin";
import SteampunkDecor from "@/components/SteampunkDecor";
import "./globals.css";
import "./themes/steampunk.css";

const GA_ID = "G-KM9VYM8YJC";

// Onest is a variable font: every weight from one file.
const onest = Onest({
  subsets: ["latin"],
  variable: "--font-onest",
  display: "swap",
});

// Steampunk theme headings and prices only: not preloaded, so other themes don't pay for it.
const pixelify = Pixelify_Sans({
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Pikorafy",
    template: "%s | Pikorafy",
  },
  description:
    "Find the best game deals with up to 90% off. Compare gaming subscriptions, key stores, and platforms. Free developer utilities included.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Pikorafy",
    title: "Pikorafy - Game Deals, Comparisons & Free Tools",
    description:
      "Find the best game deals with up to 90% off. Compare gaming subscriptions, key stores, and platforms side-by-side.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pikorafy - Game Deals, Comparisons & Free Tools",
    description:
      "Find the best game deals with up to 90% off. Compare gaming subscriptions, key stores, and platforms side-by-side.",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Pikorafy",
  url: "https://pikorafy.com",
  description:
    "Find the best game deals with up to 90% off. Compare gaming subscriptions, key stores, and platforms. Free developer tools.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://pikorafy.com/?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme="dark"
      data-density="cozy"
      data-fontpair="onest"
      className={`${onest.variable} ${jetbrainsMono.variable} ${pixelify.variable} h-full antialiased`}
      style={
        {
          "--ff-display": `var(--font-onest), 'Onest', ui-sans-serif, system-ui, sans-serif`,
          "--ff-body": `var(--font-onest), 'Onest', ui-sans-serif, system-ui, sans-serif`,
          "--ff-mono": `var(--font-jetbrains-mono), 'JetBrains Mono', ui-monospace, monospace`,
        } as React.CSSProperties
      }
    >
      <head>
        {/* The chosen theme before the first paint (no flash of the default one). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("pkfy:theme");if(t==="light"||t==="steampunk")document.documentElement.dataset.theme=t}catch(e){}`,
          }}
        />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        <HideOnAdmin><SteampunkDecor /></HideOnAdmin>
        <HideOnAdmin><PikorafyNavbar /></HideOnAdmin>
        <main className="flex-1">{children}</main>
        <HideOnAdmin><Footer /></HideOnAdmin>
      </body>
    </html>
  );
}
