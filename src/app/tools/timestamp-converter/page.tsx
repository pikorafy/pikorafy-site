import type { Metadata } from "next";
import TimestampConverterClient from "./TimestampConverterClient";

export const metadata: Metadata = {
  title: "Timestamp Converter - Pikorafy",
  description:
    "Convert between Unix timestamps and human-readable dates. Free online timestamp converter tool.",
};

export default function TimestampConverterPage() {
  return <TimestampConverterClient />;
}
