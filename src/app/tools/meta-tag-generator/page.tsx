import type { Metadata } from "next";
import MetaTagGeneratorClient from "./MetaTagGeneratorClient";

export const metadata: Metadata = {
  title: "Meta Tag Generator - Create SEO Meta Tags Online | Pikorafy",
  description:
    "Generate HTML meta tags for SEO, Open Graph, and Twitter Cards. Preview how your page appears in Google search results.",
  keywords: ["meta tag generator", "seo tags", "open graph generator", "twitter card generator", "html meta tags"],
};

export default function MetaTagGeneratorPage() {
  return <MetaTagGeneratorClient />;
}
