import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import PikorafyNavbar from "@/components/PikorafyNavbar";
import Footer from "@/components/Footer";
import "./globals.css";

const GA_ID = "G-KM9VYM8YJC";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
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
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
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
      <body className="flex min-h-full flex-col font-sans">
        <PikorafyNavbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
