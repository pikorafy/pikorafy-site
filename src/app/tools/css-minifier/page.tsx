import type { Metadata } from "next";
import CssMinifierClient from "./CssMinifierClient";

export const metadata: Metadata = {
  title: "CSS Minifier",
  description:
    "Minify CSS online by removing comments, whitespace, and unnecessary characters. Free CSS minification tool.",
};

export default function CssMinifierPage() {
  return <CssMinifierClient />;
}
