import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from "@/components/Header";
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
    "Pick smarter. Build faster. Pikorafy helps developers choose the right tools, frameworks, and libraries for every project.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Pikorafy",
    title: "Pikorafy - Pick smarter. Build faster.",
    description:
      "Pikorafy helps developers choose the right tools, frameworks, and libraries for every project.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pikorafy - Pick smarter. Build faster.",
    description:
      "Pikorafy helps developers choose the right tools, frameworks, and libraries for every project.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
