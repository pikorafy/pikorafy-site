"use client";

import { useState, useMemo } from "react";

function parseMarkdown(md: string): string {
  let html = md;

  // Escape HTML entities (but preserve our generated HTML)
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks (fenced) — must come before inline processing
  html = html.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    (_match, _lang, code) =>
      `<pre class="md-code-block"><code>${code.trim()}</code></pre>`
  );

  // Inline code
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="md-inline-code">$1</code>'
  );

  // Images (before links)
  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" class="md-image" />'
  );

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="md-link" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Headings
  html = html.replace(/^######\s+(.+)$/gm, '<h6 class="md-h6">$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm, '<h5 class="md-h5">$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4 class="md-h4">$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3 class="md-h3">$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2 class="md-h2">$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1 class="md-h1">$1</h1>');

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr class="md-hr" />');

  // Bold + italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/___(.+?)___/g, "<strong><em>$1</em></strong>");

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");

  // Italic
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/_(.+?)_/g, "<em>$1</em>");

  // Strikethrough
  html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");

  // Blockquotes (multi-level)
  html = html.replace(/^&gt;\s+(.+)$/gm, '<blockquote class="md-blockquote">$1</blockquote>');
  // Merge consecutive blockquotes
  html = html.replace(
    /<\/blockquote>\n<blockquote class="md-blockquote">/g,
    "\n"
  );

  // Unordered lists
  const lines = html.split("\n");
  let inUl = false;
  let inOl = false;
  const processed: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const ulMatch = line.match(/^[\s]*[-*+]\s+(.+)$/);
    const olMatch = line.match(/^[\s]*\d+\.\s+(.+)$/);

    if (ulMatch) {
      if (!inUl) {
        if (inOl) {
          processed.push("</ol>");
          inOl = false;
        }
        processed.push('<ul class="md-ul">');
        inUl = true;
      }
      processed.push(`<li>${ulMatch[1]}</li>`);
    } else if (olMatch) {
      if (!inOl) {
        if (inUl) {
          processed.push("</ul>");
          inUl = false;
        }
        processed.push('<ol class="md-ol">');
        inOl = true;
      }
      processed.push(`<li>${olMatch[1]}</li>`);
    } else {
      if (inUl) {
        processed.push("</ul>");
        inUl = false;
      }
      if (inOl) {
        processed.push("</ol>");
        inOl = false;
      }
      processed.push(line);
    }
  }
  if (inUl) processed.push("</ul>");
  if (inOl) processed.push("</ol>");

  html = processed.join("\n");

  // Paragraphs: wrap remaining bare lines
  html = html
    .split("\n\n")
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (
        trimmed.startsWith("<h") ||
        trimmed.startsWith("<ul") ||
        trimmed.startsWith("<ol") ||
        trimmed.startsWith("<blockquote") ||
        trimmed.startsWith("<pre") ||
        trimmed.startsWith("<hr") ||
        trimmed.startsWith("<img")
      ) {
        return trimmed;
      }
      return `<p class="md-p">${trimmed.replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");

  return html;
}

const defaultMarkdown = `# Markdown Preview

## Features

This is a **fully functional** markdown preview tool with *real-time* rendering.

### Text Formatting

You can use **bold**, *italic*, ***bold italic***, and ~~strikethrough~~ text.

### Lists

Unordered list:
- First item
- Second item
- Third item

Ordered list:
1. Step one
2. Step two
3. Step three

### Links and Images

[Visit Pikorafy](https://pikorafy.com)

### Blockquotes

> This is a blockquote.
> It can span multiple lines.

### Code

Inline \`code\` looks like this.

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

---

*Made with Pikorafy*
`;

export default function MarkdownPreviewClient() {
  const [markdown, setMarkdown] = useState(defaultMarkdown);
  const [copied, setCopied] = useState(false);

  const renderedHtml = useMemo(() => parseMarkdown(markdown), [markdown]);

  const copyHtml = async () => {
    await navigator.clipboard.writeText(renderedHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-[#0f1117] min-h-full py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Markdown Preview
            </h1>
            <p className="mt-4 text-lg text-[#8b8fa3]">
              Write Markdown on the left and see it rendered as HTML in real
              time.
            </p>
          </div>
          <button
            onClick={copyHtml}
            className="mt-4 sm:mt-0 self-start rounded-lg border border-[#2a2e3a] bg-[#1a1d27] px-4 py-2 text-sm font-medium text-[#e4e6eb] transition-colors hover:border-blue-500/50 hover:text-blue-400"
          >
            {copied ? "Copied HTML!" : "Copy rendered HTML"}
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-0 lg:grid-cols-2 rounded-xl border border-[#2a2e3a] overflow-hidden">
          {/* Editor */}
          <div className="flex flex-col border-b lg:border-b-0 lg:border-r border-[#2a2e3a]">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2a2e3a] bg-[#1a1d27]">
              <span className="text-xs font-medium text-[#8b8fa3] uppercase tracking-wider">
                Markdown
              </span>
            </div>
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              className="flex-1 min-h-[500px] w-full resize-none bg-[#0f1117] p-4 text-sm text-[#e4e6eb] font-mono leading-relaxed focus:outline-none placeholder-[#555]"
              placeholder="Type your markdown here..."
              spellCheck={false}
            />
          </div>

          {/* Preview */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2a2e3a] bg-[#1a1d27]">
              <span className="text-xs font-medium text-[#8b8fa3] uppercase tracking-wider">
                Preview
              </span>
            </div>
            <div
              className="flex-1 min-h-[500px] overflow-auto bg-[#0f1117] p-4 markdown-preview"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          </div>
        </div>
      </div>

      {/* Scoped styles for the markdown preview */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .markdown-preview .md-h1 { font-size: 2em; font-weight: 700; color: #e4e6eb; margin: 0.67em 0; line-height: 1.2; }
            .markdown-preview .md-h2 { font-size: 1.5em; font-weight: 700; color: #e4e6eb; margin: 0.83em 0; line-height: 1.3; border-bottom: 1px solid #2a2e3a; padding-bottom: 0.3em; }
            .markdown-preview .md-h3 { font-size: 1.25em; font-weight: 600; color: #e4e6eb; margin: 1em 0 0.5em; }
            .markdown-preview .md-h4 { font-size: 1.1em; font-weight: 600; color: #e4e6eb; margin: 1em 0 0.5em; }
            .markdown-preview .md-h5 { font-size: 1em; font-weight: 600; color: #e4e6eb; margin: 1em 0 0.5em; }
            .markdown-preview .md-h6 { font-size: 0.9em; font-weight: 600; color: #8b8fa3; margin: 1em 0 0.5em; }
            .markdown-preview .md-p { color: #e4e6eb; line-height: 1.7; margin: 0.8em 0; font-size: 0.9rem; }
            .markdown-preview strong { font-weight: 700; }
            .markdown-preview em { font-style: italic; }
            .markdown-preview del { text-decoration: line-through; color: #8b8fa3; }
            .markdown-preview .md-link { color: #3b82f6; text-decoration: underline; }
            .markdown-preview .md-link:hover { color: #60a5fa; }
            .markdown-preview .md-blockquote { border-left: 3px solid #3b82f6; padding: 0.5em 1em; margin: 1em 0; color: #8b8fa3; background: #1a1d27; border-radius: 0 8px 8px 0; }
            .markdown-preview .md-ul, .markdown-preview .md-ol { padding-left: 1.5em; margin: 0.8em 0; color: #e4e6eb; font-size: 0.9rem; line-height: 1.7; }
            .markdown-preview .md-ul { list-style-type: disc; }
            .markdown-preview .md-ol { list-style-type: decimal; }
            .markdown-preview .md-ul li, .markdown-preview .md-ol li { margin: 0.25em 0; }
            .markdown-preview .md-code-block { background: #1a1d27; border: 1px solid #2a2e3a; border-radius: 8px; padding: 1em; margin: 1em 0; overflow-x: auto; font-size: 0.85rem; color: #e4e6eb; line-height: 1.5; }
            .markdown-preview .md-inline-code { background: #1a1d27; border: 1px solid #2a2e3a; border-radius: 4px; padding: 0.15em 0.4em; font-size: 0.85em; color: #f472b6; }
            .markdown-preview .md-hr { border: none; border-top: 1px solid #2a2e3a; margin: 1.5em 0; }
            .markdown-preview .md-image { max-width: 100%; border-radius: 8px; margin: 1em 0; }
          `,
        }}
      />
    </div>
  );
}
