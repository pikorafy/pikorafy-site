"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface MatchResult {
  fullMatch: string;
  index: number;
  groups: string[];
}

const REFERENCE = [
  { pattern: ".", desc: "Any character except newline" },
  { pattern: "\\d", desc: "Digit [0-9]" },
  { pattern: "\\D", desc: "Non-digit" },
  { pattern: "\\w", desc: "Word character [a-zA-Z0-9_]" },
  { pattern: "\\W", desc: "Non-word character" },
  { pattern: "\\s", desc: "Whitespace" },
  { pattern: "\\S", desc: "Non-whitespace" },
  { pattern: "^", desc: "Start of string" },
  { pattern: "$", desc: "End of string" },
  { pattern: "\\b", desc: "Word boundary" },
  { pattern: "*", desc: "0 or more" },
  { pattern: "+", desc: "1 or more" },
  { pattern: "?", desc: "0 or 1" },
  { pattern: "{n}", desc: "Exactly n times" },
  { pattern: "{n,m}", desc: "Between n and m times" },
  { pattern: "(abc)", desc: "Capture group" },
  { pattern: "(?:abc)", desc: "Non-capture group" },
  { pattern: "a|b", desc: "Alternation (a or b)" },
  { pattern: "[abc]", desc: "Character class" },
  { pattern: "[^abc]", desc: "Negated character class" },
  { pattern: "(?=abc)", desc: "Positive lookahead" },
  { pattern: "(?!abc)", desc: "Negative lookahead" },
];

export default function RegexTesterClient() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [testText, setTestText] = useState("");
  const [error, setError] = useState("");

  const { matches, highlightedHtml } = useMemo(() => {
    if (!pattern || !testText) {
      return { matches: [] as MatchResult[], highlightedHtml: "" };
    }

    try {
      // Ensure 'g' flag for finding all matches
      const effectiveFlags = flags.includes("g") ? flags : flags + "g";
      const regex = new RegExp(pattern, effectiveFlags);
      setError("");

      const results: MatchResult[] = [];
      let match: RegExpExecArray | null;

      // Reset lastIndex
      regex.lastIndex = 0;

      while ((match = regex.exec(testText)) !== null) {
        results.push({
          fullMatch: match[0],
          index: match.index,
          groups: match.slice(1),
        });
        // Prevent infinite loops for zero-length matches
        if (match[0].length === 0) {
          regex.lastIndex++;
        }
      }

      // Build highlighted HTML
      let html = "";
      let lastIndex = 0;
      for (const r of results) {
        // Escape HTML for non-matched parts
        const before = escapeHtml(testText.slice(lastIndex, r.index));
        const matched = escapeHtml(r.fullMatch);
        html += before;
        html += `<mark class="bg-blue-500/30 text-blue-300 rounded px-0.5">${matched}</mark>`;
        lastIndex = r.index + r.fullMatch.length;
      }
      html += escapeHtml(testText.slice(lastIndex));

      return { matches: results, highlightedHtml: html };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Invalid regex";
      setError(msg);
      return { matches: [] as MatchResult[], highlightedHtml: "" };
    }
  }, [pattern, flags, testText]);

  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/\n/g, "<br/>");
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
          <span className="text-[#e4e6eb]">Regex Tester</span>
        </nav>

        <h1 className="text-3xl font-bold tracking-tight text-[#e4e6eb] sm:text-4xl">
          Regex Tester
        </h1>
        <p className="mt-3 text-[#8b8fa3] max-w-2xl">
          Test regular expressions against your text with live matching and
          capture group display.
        </p>

        {/* Pattern input */}
        <div className="mt-8 flex flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <label className="mb-2 block text-sm font-medium text-[#8b8fa3]">
              Pattern
            </label>
            <div className="flex items-center rounded-lg border border-[#2a2e3a] bg-[#1a1d27]">
              <span className="pl-3 text-[#8b8fa3]">/</span>
              <input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="[a-z]+@[a-z]+\.[a-z]+"
                spellCheck={false}
                className="flex-1 bg-transparent px-2 py-2.5 font-mono text-sm text-[#e4e6eb] placeholder-[#8b8fa3]/50 focus:outline-none"
              />
              <span className="pr-3 text-[#8b8fa3]">/</span>
            </div>
          </div>
          <div className="w-28">
            <label className="mb-2 block text-sm font-medium text-[#8b8fa3]">
              Flags
            </label>
            <input
              type="text"
              value={flags}
              onChange={(e) => setFlags(e.target.value)}
              placeholder="gim"
              spellCheck={false}
              className="w-full rounded-lg border border-[#2a2e3a] bg-[#1a1d27] px-3 py-2.5 font-mono text-sm text-[#e4e6eb] placeholder-[#8b8fa3]/50 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <span className="font-medium">Error:</span> {error}
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Test text */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[#8b8fa3]">
              Test String
            </label>
            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Enter text to test against..."
              spellCheck={false}
              className="h-52 w-full resize-y rounded-lg border border-[#2a2e3a] bg-[#1a1d27] p-4 font-mono text-sm text-[#e4e6eb] placeholder-[#8b8fa3]/50 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Highlighted output */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[#8b8fa3]">
              Matches Highlighted
            </label>
            <div
              className="h-52 overflow-auto rounded-lg border border-[#2a2e3a] bg-[#1a1d27] p-4 font-mono text-sm text-[#e4e6eb] whitespace-pre-wrap"
              dangerouslySetInnerHTML={{
                __html: highlightedHtml || '<span class="text-[#8b8fa3]/50">Highlighted results will appear here...</span>',
              }}
            />
          </div>
        </div>

        {/* Match details */}
        {matches.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-3 text-lg font-semibold text-[#e4e6eb]">
              Matches ({matches.length})
            </h2>
            <div className="space-y-2 max-h-60 overflow-auto">
              {matches.map((m, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-[#2a2e3a] bg-[#1a1d27] px-4 py-3"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-[#8b8fa3]">#{i + 1}</span>
                    <code className="text-sm text-blue-400">
                      &quot;{m.fullMatch}&quot;
                    </code>
                    <span className="text-xs text-[#8b8fa3]">
                      index: {m.index}
                    </span>
                  </div>
                  {m.groups.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.groups.map((g, gi) => (
                        <span
                          key={gi}
                          className="rounded-md bg-[#2a2e3a] px-2 py-0.5 text-xs text-[#e4e6eb]"
                        >
                          Group {gi + 1}:{" "}
                          <code className="text-green-400">
                            &quot;{g ?? ""}&quot;
                          </code>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reference */}
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-[#e4e6eb]">
            Regex Quick Reference
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {REFERENCE.map((r) => (
              <div
                key={r.pattern}
                className="flex items-center gap-3 rounded-lg border border-[#2a2e3a] bg-[#1a1d27] px-3 py-2"
              >
                <code className="text-sm font-bold text-blue-400 min-w-[4rem]">
                  {r.pattern}
                </code>
                <span className="text-xs text-[#8b8fa3]">{r.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
