"use client";

import { useState } from "react";
import Link from "next/link";

function minifyCss(css: string): string {
  let result = css;

  // Remove block comments /* ... */
  result = result.replace(/\/\*[\s\S]*?\*\//g, "");

  // Remove single-line comments // ... (only outside of strings/urls)
  result = result.replace(/(^|[^:])\/\/.*$/gm, "$1");

  // Remove newlines and carriage returns
  result = result.replace(/[\r\n]+/g, "");

  // Collapse multiple spaces into one
  result = result.replace(/\s{2,}/g, " ");

  // Remove spaces around { } : ; , > ~ +
  result = result.replace(/\s*([{}:;,>~+])\s*/g, "$1");

  // Remove trailing semicolons before closing braces
  result = result.replace(/;}/g, "}");

  // Remove leading/trailing whitespace
  result = result.trim();

  return result;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(2)} KB`;
}

export default function CssMinifierClient() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<{
    original: number;
    minified: number;
    savings: number;
  } | null>(null);

  function handleMinify() {
    setError("");
    setCopied(false);
    if (!input.trim()) {
      setError("Please enter some CSS to minify.");
      setOutput("");
      setStats(null);
      return;
    }
    try {
      const minified = minifyCss(input);
      setOutput(minified);

      const originalSize = new TextEncoder().encode(input).length;
      const minifiedSize = new TextEncoder().encode(minified).length;
      const savings =
        originalSize > 0
          ? ((originalSize - minifiedSize) / originalSize) * 100
          : 0;
      setStats({ original: originalSize, minified: minifiedSize, savings });
    } catch {
      setError("Failed to minify CSS.");
      setOutput("");
      setStats(null);
    }
  }

  function handleCopy() {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleClear() {
    setInput("");
    setOutput("");
    setError("");
    setCopied(false);
    setStats(null);
  }

  function handleSample() {
    const sample = `/* Main container styles */
body {
  margin: 0;
  padding: 0;
  font-family: 'Inter', sans-serif;
  background-color: #0f1117;
  color: #e4e6eb;
}

/* Navigation */
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  border-bottom: 1px solid #2a2e3a;
}

.navbar a {
  color: #8b8fa3;
  text-decoration: none;
  transition: color 0.2s;
}

.navbar a:hover {
  color: #3B82F6;
}

/* Card component */
.card {
  background: #1a1d27;
  border: 1px solid #2a2e3a;
  border-radius: 0.75rem;
  padding: 1.5rem;
}`;
    setInput(sample);
    setOutput("");
    setError("");
    setStats(null);
  }

  return (
    <div className="bg-[#0f1117] min-h-full py-12 sm:py-20">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-[#8b8fa3]">
          <Link href="/tools" className="hover:text-blue-500 transition-colors">
            Tools
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#e4e6eb]">CSS Minifier</span>
        </nav>

        <h1 className="text-3xl font-bold tracking-tight text-[#e4e6eb] sm:text-4xl">
          CSS Minifier
        </h1>
        <p className="mt-3 text-[#8b8fa3] max-w-2xl">
          Paste your CSS below to minify it. Comments, unnecessary whitespace,
          and redundant semicolons are removed to reduce file size.
        </p>

        {/* Controls */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            onClick={handleMinify}
            className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
          >
            Minify
          </button>
          <button
            onClick={handleClear}
            className="rounded-lg border border-[#2a2e3a] bg-[#1a1d27] px-5 py-2.5 text-sm font-medium text-[#8b8fa3] hover:text-[#e4e6eb] transition-colors"
          >
            Clear
          </button>
          <button
            onClick={handleSample}
            className="rounded-lg border border-[#2a2e3a] bg-[#1a1d27] px-5 py-2.5 text-sm font-medium text-[#8b8fa3] hover:text-[#e4e6eb] transition-colors"
          >
            Load Sample
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <span className="font-medium">Error:</span> {error}
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="rounded-lg border border-[#2a2e3a] bg-[#1a1d27] px-4 py-3">
              <div className="text-xs text-[#8b8fa3]">Original</div>
              <div className="text-sm font-medium text-[#e4e6eb]">
                {formatBytes(stats.original)}
              </div>
            </div>
            <div className="rounded-lg border border-[#2a2e3a] bg-[#1a1d27] px-4 py-3">
              <div className="text-xs text-[#8b8fa3]">Minified</div>
              <div className="text-sm font-medium text-[#e4e6eb]">
                {formatBytes(stats.minified)}
              </div>
            </div>
            <div className="rounded-lg border border-[#2a2e3a] bg-[#1a1d27] px-4 py-3">
              <div className="text-xs text-[#8b8fa3]">Savings</div>
              <div className="text-sm font-medium text-green-400">
                {stats.savings.toFixed(1)}%
              </div>
            </div>
          </div>
        )}

        {/* Textareas */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#8b8fa3]">
              Input
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder=".selector { property: value; }"
              spellCheck={false}
              className="h-80 w-full resize-y rounded-lg border border-[#2a2e3a] bg-[#1a1d27] p-4 font-mono text-sm text-[#e4e6eb] placeholder-[#8b8fa3]/50 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-[#8b8fa3]">
                Output
              </label>
              <button
                onClick={handleCopy}
                disabled={!output}
                className="rounded-md border border-[#2a2e3a] bg-[#1a1d27] px-3 py-1.5 text-xs font-medium text-[#8b8fa3] hover:text-[#e4e6eb] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <textarea
              value={output}
              readOnly
              spellCheck={false}
              placeholder="Minified CSS will appear here..."
              className="h-80 w-full resize-y rounded-lg border border-[#2a2e3a] bg-[#1a1d27] p-4 font-mono text-sm text-[#e4e6eb] placeholder-[#8b8fa3]/50 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
