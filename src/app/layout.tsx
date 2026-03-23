import type { Metadata } from "next";
import { Inter } from "next/font/google";
import PikorafyNavbar from "@/components/PikorafyNavbar";
import Footer from "@/components/Footer";
import "./globals.css";

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
    "Navigate the AI revolution. Compare 500+ AI tools side-by-side with honest reviews and real benchmarks. ChatGPT, Claude, Gemini, Midjourney, and more.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Pikorafy",
    title: "Pikorafy - Navigate the AI Revolution",
    description:
      "Compare 500+ AI tools side-by-side. Honest reviews, real benchmarks, and free developer utilities.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pikorafy - Navigate the AI Revolution",
    description:
      "Compare 500+ AI tools side-by-side. Honest reviews, real benchmarks, and free developer utilities.",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Pikorafy",
  url: "https://pikorafy.com",
  description:
    "Navigate the AI revolution. Compare 500+ AI tools side-by-side with honest reviews and real benchmarks.",
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
