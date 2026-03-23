import type { Metadata } from "next";
import SvgToPngClient from "./SvgToPngClient";

export const metadata: Metadata = {
  title: "SVG to PNG Converter - Pikorafy",
  description:
    "Convert SVG to PNG. Paste SVG code or upload a file, choose output size, and download as PNG.",
};

export default function SvgToPngPage() {
  return <SvgToPngClient />;
}
