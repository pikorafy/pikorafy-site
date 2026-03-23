import type { Metadata } from "next";
import HashGeneratorClient from "./HashGeneratorClient";

export const metadata: Metadata = {
  title: "Hash Generator - Pikorafy",
  description:
    "Generate MD5, SHA-1, SHA-256, and SHA-512 hashes from text. Free online hash generator tool.",
};

export default function HashGeneratorPage() {
  return <HashGeneratorClient />;
}
