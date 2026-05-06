import type { Metadata } from "next";
import Script from "next/script";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import PikorafyNavbar from "@/components/PikorafyNavbar";
import Footer from "@/components/Footer";
import "./globals.css";

const GA_ID = "G-KM9VYM8YJC";

const spaceGrotesk = Space_Grotesk({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
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
      data-theme="dark"
      data-density="cozy"
      data-fontpair="grotesk"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
      style={
        {
          "--ff-display": `var(--font-space-grotesk), 'Space Grotesk', ui-sans-serif, system-ui, sans-serif`,
          "--ff-body": `var(--font-space-grotesk), 'Space Grotesk', ui-sans-serif, system-ui, sans-serif`,
          "--ff-mono": `var(--font-jetbrains-mono), 'JetBrains Mono', ui-monospace, monospace`,
        } as React.CSSProperties
      }
    >
      <head>
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
        <PikorafyNavbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
