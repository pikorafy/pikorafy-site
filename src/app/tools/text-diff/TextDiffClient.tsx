"use client";

import { useState } from "react";
import Link from "next/link";

interface DiffLine {
  type: "equal" | "added" | "removed";
  text: string;
  oldLine?: number;
  newLine?: number;
}

/**
 * Myers-style LCS diff algorithm.
 * Computes the longest common subsequence then builds the diff.
 */
function computeDiff(oldLines: string[], newLines: string[]): DiffLine[] {
  const m = oldLines.length;
  const n = newLines.length;

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to get diff
  const result: DiffLine[] = [];
  let i = m,
    j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.push({
        type: "equal",
        text: oldLines[i - 1],
        oldLine: i,
        newLine: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({ type: "added", text: newLines[j - 1], newLine: j });
      j--;
    } else {
      result.push({ type: "removed", text: oldLines[i - 1], oldLine: i });
      i--;
    }
  }

  return result.reverse();
}

export default function TextDiffClient() {
  const [original, setOriginal] = useState("");
  const [modified, setModified] = useState("");
  const [diff, setDiff] = useState<DiffLine[] | null>(null);
  const [stats, setStats] = useState({ added: 0, removed: 0, unchanged: 0 });

  function handleCompare() {
    const oldLines = original.split("\n");
    const newLines = modified.split("\n");
    const result = computeDiff(oldLines, newLines);
    setDiff(result);

    let added = 0,
      removed = 0,
      unchanged = 0;
    for (const line of result) {
      if (line.type === "added") added++;
      else if (line.type === "removed") removed++;
      else unchanged++;
    }
    setStats({ added, removed, unchanged });
  }

  function handleClear() {
    setOriginal("");
    setModified("");
    setDiff(null);
  }

  function handleSample() {
    setOriginal(
      `function greet(name) {
  console.log("Hello, " + name);
  return true;
}

const result = greet("World");`
    );
    setModified(
      `function greet(name, greeting = "Hello") {
  const message = greeting + ", " + name + "!";
  console.log(message);
  return message;
}

const result = greet("World");
console.log(result);`
    );
    setDiff(null);
  }

  function lineClass(type: DiffLine["type"]): string {
    switch (type) {
      case "added":
        return "bg-green-500/15 border-l-2 border-green-500";
      case "removed":
        return "bg-red-500/15 border-l-2 border-red-500";
      default:
        return "border-l-2 border-transparent";
    }
  }

  function linePrefix(type: DiffLine["type"]): string {
    switch (type) {
      case "added":
        return "+";
      case "removed":
        return "-";
      default:
        return " ";
    }
  }

  function prefixColor(type: DiffLine["type"]): string {
    switch (type) {
      case "added":
        return "text-green-400";
      case "removed":
        return "text-red-400";
      default:
        return "text-[#8b8fa3]";
    }
  }

  return (
    <div className="bg-[#0f1117] min-h-full py-12 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-[#8b8fa3]">
          <Link href="/tools" className="hover:text-blue-500 transition-colors">
            Tools
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#e4e6eb]">Text Diff</span>
        </nav>

        <h1 className="text-3xl font-bold tracking-tight text-[#e4e6eb] sm:text-4xl">
          Text Diff Tool
        </h1>
        <p className="mt-3 text-[#8b8fa3] max-w-2xl">
          Paste two blocks of text and compare them line by line. Additions are
          highlighted in green, deletions in red.
        </p>

        {/* Controls */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            onClick={handleCompare}
            disabled={!original && !modified}
            className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Compare
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

        {/* Input textareas */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#8b8fa3]">
              Original
            </label>
            <textarea
              value={original}
              onChange={(e) => setOriginal(e.target.value)}
              placeholder="Paste the original text here..."
              spellCheck={false}
              className="h-52 w-full resize-y rounded-lg border border-[#2a2e3a] bg-[#1a1d27] p-4 font-mono text-sm text-[#e4e6eb] placeholder-[#8b8fa3]/50 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#8b8fa3]">
              Modified
            </label>
            <textarea
              value={modified}
              onChange={(e) => setModified(e.target.value)}
              placeholder="Paste the modified text here..."
              spellCheck={false}
              className="h-52 w-full resize-y rounded-lg border border-[#2a2e3a] bg-[#1a1d27] p-4 font-mono text-sm text-[#e4e6eb] placeholder-[#8b8fa3]/50 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Diff output */}
        {diff && (
          <div className="mt-8">
            {/* Stats bar */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <span className="text-sm text-[#8b8fa3]">
                <span className="font-medium text-[#e4e6eb]">
                  {diff.length}
                </span>{" "}
                lines
              </span>
              <span className="text-sm text-green-400">
                +{stats.added} added
              </span>
              <span className="text-sm text-red-400">
                -{stats.removed} removed
              </span>
              <span className="text-sm text-[#8b8fa3]">
                {stats.unchanged} unchanged
              </span>
            </div>

            {/* Diff lines */}
            <div className="overflow-x-auto rounded-lg border border-[#2a2e3a] bg-[#1a1d27]">
              <div className="min-w-[600px]">
                {diff.map((line, i) => (
                  <div
                    key={i}
                    className={`flex font-mono text-sm ${lineClass(line.type)}`}
                  >
                    {/* Old line number */}
                    <span className="w-12 shrink-0 select-none px-2 py-0.5 text-right text-xs text-[#8b8fa3]/60">
                      {line.oldLine ?? ""}
                    </span>
                    {/* New line number */}
                    <span className="w-12 shrink-0 select-none px-2 py-0.5 text-right text-xs text-[#8b8fa3]/60 border-r border-[#2a2e3a]">
                      {line.newLine ?? ""}
                    </span>
                    {/* Prefix */}
                    <span
                      className={`w-6 shrink-0 select-none text-center py-0.5 ${prefixColor(
                        line.type
                      )}`}
                    >
                      {linePrefix(line.type)}
                    </span>
                    {/* Content */}
                    <span
                      className={`flex-1 py-0.5 pr-4 whitespace-pre ${
                        line.type === "added"
                          ? "text-green-300"
                          : line.type === "removed"
                          ? "text-red-300"
                          : "text-[#e4e6eb]"
                      }`}
                    >
                      {line.text}
                    </span>
                  </div>
                ))}

                {diff.length === 0 && (
                  <div className="px-6 py-8 text-center text-[#8b8fa3]">
                    Both texts are identical — no differences found.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
