import type { Metadata } from "next";
import CssGradientGeneratorClient from "./CssGradientGeneratorClient";

export const metadata: Metadata = {
  title: "CSS Gradient Generator - Pikorafy",
  description:
    "Create beautiful CSS gradients with a visual builder. Pick colors, adjust angle, and copy the CSS code.",
};

export default function CssGradientGeneratorPage() {
  return <CssGradientGeneratorClient />;
}
