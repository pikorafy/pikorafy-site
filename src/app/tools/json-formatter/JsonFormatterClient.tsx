"use client";

import { useState } from "react";
import Link from "next/link";

export default function JsonFormatterClient() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [indentSize, setIndentSize] = useState(2);

  function handleFormat() {
    setError("");
    setCopied(false);
    if (!input.trim()) {
      setError("Please enter some JSON to format.");
      setOutput("");
      return;
    }
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, indentSize));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Invalid JSON";
      setError(msg);
      setOutput("");
    }
  }

  function handleMinify() {
    setError("");
    setCopied(false);
    if (!input.trim()) {
      setError("Please enter some JSON to minify.");
      setOutput("");
      return;
    }
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Invalid JSON";
      setError(msg);
      setOutput("");
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
  }

  function handleSample() {
    const sample = JSON.stringify(
      {
        name: "Pikorafy",
        version: "1.0.0",
        features: ["tools", "comparisons", "guides"],
        config: { theme: "dark", language: "en" },
      },
      null,
      2
    );
    setInput(sample);
    setOutput("");
    setError("");
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
          <span className="text-[#e4e6eb]">JSON Formatter</span>
        </nav>

        <h1 className="text-3xl font-bold tracking-tight text-[#e4e6eb] sm:text-4xl">
          JSON Formatter & Minifier
        </h1>
        <p className="mt-3 text-[#8b8fa3] max-w-2xl">
          Paste your JSON data below to format it with proper indentation or
          minify it into a single line. Invalid JSON errors are shown instantly.
        </p>

        {/* Controls */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            onClick={handleFormat}
            className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
          >
            Format
          </button>
          <button
            onClick={handleMinify}
            className="rounded-lg border border-[#2a2e3a] bg-[#1a1d27] px-5 py-2.5 text-sm font-medium text-[#e4e6eb] hover:border-blue-500/50 transition-colors"
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

          <div className="ml-auto flex items-center gap-2">
            <label htmlFor="indent" className="text-sm text-[#8b8fa3]">
              Indent:
            </label>
            <select
              id="indent"
              value={indentSize}
              onChange={(e) => setIndentSize(Number(e.target.value))}
              className="rounded-lg border border-[#2a2e3a] bg-[#1a1d27] px-3 py-2 text-sm text-[#e4e6eb] focus:border-blue-500 focus:outline-none"
            >
              <option value={2}>2 spaces</option>
              <option value={4}>4 spaces</option>
              <option value={1}>1 tab</option>
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <span className="font-medium">Error:</span> {error}
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
              placeholder='{"key": "value"}'
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
              placeholder="Formatted or minified JSON will appear here..."
              className="h-80 w-full resize-y rounded-lg border border-[#2a2e3a] bg-[#1a1d27] p-4 font-mono text-sm text-[#e4e6eb] placeholder-[#8b8fa3]/50 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
