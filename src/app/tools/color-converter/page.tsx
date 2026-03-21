import type { Metadata } from "next";
import ColorConverterClient from "./ColorConverterClient";

export const metadata: Metadata = {
  title: "Color Converter",
  description:
    "Convert colors between HEX, RGB, and HSL formats with live preview. Copy any format to clipboard. Free online color tool.",
};

export default function ColorConverterPage() {
  return <ColorConverterClient />;
}
