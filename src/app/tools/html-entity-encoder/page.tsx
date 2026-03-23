import type { Metadata } from "next";
import HtmlEntityEncoderClient from "./HtmlEntityEncoderClient";

export const metadata: Metadata = {
  title: "HTML Entity Encoder / Decoder - Pikorafy",
  description:
    "Encode and decode HTML entities. Free online HTML entity encoder/decoder tool for developers.",
};

export default function HtmlEntityEncoderPage() {
  return <HtmlEntityEncoderClient />;
}
