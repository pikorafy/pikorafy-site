import type { Metadata } from "next";
import MarkdownPreviewClient from "./MarkdownPreviewClient";

export const metadata: Metadata = {
  title: "Markdown Preview - Live Markdown Editor Online | Pikorafy",
  description:
    "Write Markdown and see it rendered as HTML in real time. Supports headings, bold, italic, lists, code blocks, links, images, and blockquotes.",
  keywords: ["markdown preview", "markdown editor", "markdown to html", "live markdown", "online markdown"],
};

export default function MarkdownPreviewPage() {
  return <MarkdownPreviewClient />;
}
