import type { Metadata } from "next";
import CssMinifierClient from "./CssMinifierClient";

export const metadata: Metadata = {
  title: "CSS Minifier",
  description:
    "Minify CSS code online. Remove comments, whitespace, and unnecessary characters to reduce file size.",
};

export default function CssMinifierPage() {
  return <CssMinifierClient />;
}
