import type { Metadata } from "next";
import TextDiffClient from "./TextDiffClient";

export const metadata: Metadata = {
  title: "Text Diff Tool",
  description:
    "Compare two blocks of text and see the differences highlighted line by line. Additions in green, deletions in red. Free online diff tool.",
};

export default function TextDiffPage() {
  return <TextDiffClient />;
}
