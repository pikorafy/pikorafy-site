"use client";

import { useState } from "react";

export default function MetaTagGeneratorClient() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [author, setAuthor] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const truncate = (str: string, max: number) =>
    str.length > max ? str.slice(0, max) + "..." : str;

  const generateMetaTags = () => {
    const lines: string[] = [];
    lines.push(`<meta charset="UTF-8">`);
    lines.push(`<meta name="viewport" content="width=device-width, initial-scale=1.0">`);
    if (title) lines.push(`<title>${title}</title>`);
    if (description)
      lines.push(`<meta name="description" content="${description}">`);
    if (keywords) lines.push(`<meta name="keywords" content="${keywords}">`);
    if (author) lines.push(`<meta name="author" content="${author}">`);
    if (canonicalUrl)
      lines.push(`<link rel="canonical" href="${canonicalUrl}">`);

    // Open Graph
    lines.push("");
    lines.push("<!-- Open Graph / Facebook -->");
    if (title) lines.push(`<meta property="og:title" content="${title}">`);
    if (description)
      lines.push(`<meta property="og:description" content="${description}">`);
    lines.push(`<meta property="og:type" content="website">`);
    if (ogImage) lines.push(`<meta property="og:image" content="${ogImage}">`);
    if (canonicalUrl)
      lines.push(`<meta property="og:url" content="${canonicalUrl}">`);

    // Twitter
    lines.push("");
    lines.push("<!-- Twitter -->");
    lines.push(
      `<meta name="twitter:card" content="${ogImage ? "summary_large_image" : "summary"}">`
    );
    if (title) lines.push(`<meta name="twitter:title" content="${title}">`);
    if (description)
      lines.push(
        `<meta name="twitter:description" content="${description}">`
      );
    if (ogImage)
      lines.push(`<meta name="twitter:image" content="${ogImage}">`);
    if (twitterHandle)
      lines.push(`<meta name="twitter:site" content="${twitterHandle}">`);

    return lines.join("\n");
  };

  const metaTags = generateMetaTags();

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(metaTags);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const inputClass =
    "w-full rounded-lg border border-[#2a2e3a] bg-[#0f1117] px-4 py-2.5 text-[#e4e6eb] placeholder-[#555] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm";

  return (
    <div className="bg-[#0f1117] min-h-full py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Meta Tag Generator
        </h1>
        <p className="mt-4 text-lg text-[#8b8fa3]">
          Generate HTML meta tags for SEO, Open Graph, and Twitter Cards.
          Preview how your page will appear in Google search results.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Input Form */}
          <div className="space-y-5">
            <div className="rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-6 space-y-4">
              <h2 className="text-sm font-semibold text-[#e4e6eb] uppercase tracking-wider">
                Basic Meta
              </h2>
              <div>
                <label className="block text-sm text-[#8b8fa3] mb-1.5">
                  Page Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="My Awesome Website"
                  className={inputClass}
                  maxLength={70}
                />
                <p className="mt-1 text-xs text-[#555]">
                  {title.length}/70 characters
                </p>
              </div>
              <div>
                <label className="block text-sm text-[#8b8fa3] mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A brief description of your page content..."
                  className={inputClass + " resize-none"}
                  rows={3}
                  maxLength={160}
                />
                <p className="mt-1 text-xs text-[#555]">
                  {description.length}/160 characters
                </p>
              </div>
              <div>
                <label className="block text-sm text-[#8b8fa3] mb-1.5">
                  Keywords
                </label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="seo, web development, tools"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm text-[#8b8fa3] mb-1.5">
                  Author
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="John Doe"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm text-[#8b8fa3] mb-1.5">
                  Canonical URL
                </label>
                <input
                  type="url"
                  value={canonicalUrl}
                  onChange={(e) => setCanonicalUrl(e.target.value)}
                  placeholder="https://example.com/page"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-6 space-y-4">
              <h2 className="text-sm font-semibold text-[#e4e6eb] uppercase tracking-wider">
                Social Media
              </h2>
              <div>
                <label className="block text-sm text-[#8b8fa3] mb-1.5">
                  OG Image URL
                </label>
                <input
                  type="url"
                  value={ogImage}
                  onChange={(e) => setOgImage(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm text-[#8b8fa3] mb-1.5">
                  Twitter Handle
                </label>
                <input
                  type="text"
                  value={twitterHandle}
                  onChange={(e) => setTwitterHandle(e.target.value)}
                  placeholder="@username"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Preview & Output */}
          <div className="space-y-5">
            {/* Google Preview */}
            <div className="rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-6">
              <h2 className="text-sm font-semibold text-[#e4e6eb] uppercase tracking-wider mb-4">
                Google Search Preview
              </h2>
              <div className="rounded-lg bg-white p-4">
                <p className="text-sm text-[#202124] truncate">
                  {canonicalUrl || "https://example.com/page"}
                </p>
                <h3 className="mt-1 text-xl text-[#1a0dab] leading-snug hover:underline cursor-pointer">
                  {title || "Page Title"}
                </h3>
                <p className="mt-1 text-sm text-[#4d5156] leading-relaxed">
                  {truncate(description || "Page description will appear here. Add a description to see a preview of how it looks in search results.", 160)}
                </p>
              </div>
            </div>

            {/* Generated Tags */}
            <div className="rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-[#e4e6eb] uppercase tracking-wider">
                  Generated Meta Tags
                </h2>
                <button
                  onClick={copyToClipboard}
                  className="rounded-lg border border-[#2a2e3a] bg-[#0f1117] px-4 py-1.5 text-xs font-medium text-[#e4e6eb] transition-colors hover:border-blue-500/50 hover:text-blue-400"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre className="overflow-x-auto rounded-lg bg-[#0f1117] border border-[#2a2e3a] p-4 text-xs text-[#e4e6eb] font-mono leading-relaxed whitespace-pre-wrap">
                {metaTags}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
