import type { Metadata } from "next";
import WordCounterClient from "./WordCounterClient";

export const metadata: Metadata = {
  title: "Word Counter - Pikorafy",
  description:
    "Count words, characters, sentences, paragraphs, and estimate reading time. Free online word counter tool.",
};

export default function WordCounterPage() {
  return <WordCounterClient />;
}
