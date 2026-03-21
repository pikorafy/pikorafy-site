import type { Metadata } from "next";
import JsonFormatterClient from "./JsonFormatterClient";

export const metadata: Metadata = {
  title: "JSON Formatter & Minifier",
  description:
    "Format, validate, and minify JSON data online. Free JSON beautifier with syntax error detection.",
};

export default function JsonFormatterPage() {
  return <JsonFormatterClient />;
}
