import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Free Developer Tools - Pikorafy",
  description:
    "Free online developer tools: JSON formatter, password generator, Base64 encoder, UUID generator, and more.",
};

const tools = [
  {
    title: "JSON Formatter",
    description: "Format, validate, and minify JSON data with syntax highlighting.",
    slug: "json-formatter",
    category: "Data",
  },
  {
    title: "Password Generator",
    description: "Generate strong, secure passwords with customizable rules.",
    slug: "password-generator",
    category: "Security",
  },
  {
    title: "Base64 Encoder",
    description: "Encode and decode Base64 strings for data transfer.",
    slug: "base64-encoder",
    category: "Encoding",
  },
  {
    title: "Color Converter",
    description: "Convert between HEX, RGB, HSL, and other color formats.",
    slug: "color-converter",
    category: "Design",
  },
  {
    title: "Markdown Preview",
    description: "Write Markdown and see it rendered as HTML in real time.",
    slug: "markdown-preview",
    category: "Text",
  },
  {
    title: "UUID Generator",
    description: "Generate UUID v4 identifiers on the fly.",
    slug: "uuid-generator",
    category: "Data",
  },
  {
    title: "Regex Tester",
    description: "Test and debug regular expressions with live matching.",
    slug: "regex-tester",
    category: "Text",
  },
  {
    title: "JWT Decoder",
    description: "Decode and inspect JSON Web Token payloads.",
    slug: "jwt-decoder",
    category: "Security",
  },
  {
    title: "CSS Minifier",
    description: "Minify CSS files to reduce payload size.",
    slug: "css-minifier",
    category: "Code",
  },
  {
    title: "Hash Generator",
    description: "Generate MD5, SHA-1, SHA-256, and other hash digests.",
    slug: "hash-generator",
    category: "Security",
  },
  {
    title: "Lorem Ipsum Generator",
    description: "Generate placeholder text for designs and prototypes.",
    slug: "lorem-ipsum",
    category: "Text",
  },
  {
    title: "URL Encoder",
    description: "Encode and decode URLs for safe data transmission.",
    slug: "url-encoder",
    category: "Encoding",
  },
];

const categories = Array.from(new Set(tools.map((t) => t.category)));

export default function ToolsPage() {
  return (
    <div className="bg-[#0f1117] min-h-full py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Free Developer Tools
          </h1>
          <p className="mt-4 text-lg text-zinc-400">
            Handy utilities for developers. No signup required, no data stored.
          </p>
        </div>

        {/* Category Filter */}
        <div className="mt-8 flex flex-wrap gap-2">
          <span className="inline-flex rounded-lg bg-[#3B82F6] px-3 py-1.5 text-xs font-medium text-white">
            All
          </span>
          {categories.map((cat) => (
            <span
              key={cat}
              className="inline-flex rounded-lg border border-zinc-700 bg-[#1a1d27] px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-[#3B82F6]/50 hover:text-white cursor-pointer"
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Tools Grid */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tools.map((tool) => (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className="group flex flex-col rounded-xl border border-zinc-800 bg-[#1a1d27] p-6 transition-all hover:border-[#3B82F6]/50 hover:bg-[#1e2231]"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex rounded-md bg-[#3B82F6]/10 px-2 py-0.5 text-xs font-medium text-[#3B82F6]">
                  {tool.category}
                </span>
                <span className="text-xs text-zinc-600">Free</span>
              </div>
              <h2 className="mt-4 text-base font-semibold text-white group-hover:text-[#3B82F6] transition-colors">
                {tool.title}
              </h2>
              <p className="mt-2 flex-1 text-sm text-zinc-400">
                {tool.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#3B82F6]">
                Open tool
                <svg
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
