import type { Metadata } from "next";
import JsonToCsvClient from "./JsonToCsvClient";

export const metadata: Metadata = {
  title: "JSON to CSV Converter - Pikorafy",
  description:
    "Convert JSON arrays to CSV format. Free online JSON to CSV converter tool with download.",
};

export default function JsonToCsvPage() {
  return <JsonToCsvClient />;
}
