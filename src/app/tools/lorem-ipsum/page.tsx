import type { Metadata } from "next";
import LoremIpsumClient from "./LoremIpsumClient";

export const metadata: Metadata = {
  title: "Lorem Ipsum Generator - Placeholder Text Online | Pikorafy",
  description:
    "Generate Lorem Ipsum placeholder text by paragraphs, sentences, or words. Perfect for mockups, designs, and prototypes.",
  keywords: ["lorem ipsum generator", "placeholder text", "dummy text", "filler text", "lorem ipsum"],
};

export default function LoremIpsumPage() {
  return <LoremIpsumClient />;
}
