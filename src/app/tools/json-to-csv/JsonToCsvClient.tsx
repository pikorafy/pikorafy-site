"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

function jsonToCsv(jsonStr: string): string {
  const data = JSON.parse(jsonStr);

  if (!Array.isArray(data)) {
    throw new Error("Input must be a JSON array of objects.");
  }

  if (data.length === 0) {
    throw new Error("Array is empty.");
  }

  // Collect all unique keys
  const headers = new Set<string>();
  for (const item of data) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      throw new Error("Each element in the array must be a plain object.");
    }
    Object.keys(item).forEach((key) => headers.add(key));
  }

  const headerArr = Array.from(headers);

  const escapeCsv = (val: unknown): string => {
    if (val === null || val === undefined) return "";
    const str = typeof val === "object" ? JSON.stringify(val) : String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [headerArr.map(escapeCsv).join(",")];

  for (const item of data) {
    const row = headerArr.map((h) => escapeCsv(item[h]));
    lines.push(row.join(","));
  }

  return lines.join("\n");
}

export default function JsonToCsvClient() {
  const [jsonInput, setJsonInput] = useState("");
  const [csvOutput, setCsvOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const convert = useCallback(() => {
    setError("");
    setCsvOutput("");
    if (!jsonInput.trim()) {
      setError("Please enter JSON data.");
      return;
    }
    try {
      const csv = jsonToCsv(jsonInput);
      setCsvOutput(csv);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON input.");
    }
  }, [jsonInput]);

  const download = useCallback(() => {
    const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [csvOutput]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(csvOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sampleJson = `[
  { "name": "Alice", "age": 30, "city": "New York" },
  { "name": "Bob", "age": 25, "city": "San Francisco" },
  { "name": "Charlie", "age": 35, "city": "Chicago" }
]`;

  return (
    <div className="bg-[#0f1117] min-h-full py-12 sm:py-20">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-[#8b8fa3]">
          <Link href="/tools" className="hover:text-blue-500 transition-colors">
            Tools
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#e4e6eb]">JSON to CSV</span>
        </nav>

        <h1 className="text-3xl font-bold tracking-tight text-[#e4e6eb] sm:text-4xl">
          JSON to CSV Converter
        </h1>
        <p className="mt-3 text-[#8b8fa3] max-w-2xl">
          Paste a JSON array of objects below and convert it to CSV format.
          Download the result or copy to clipboard.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* JSON Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-[#8b8fa3]">
                JSON Input
              </label>
              <button
                onClick={() => setJsonInput(sampleJson)}
                className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
              >
                Load sample
              </button>
            </div>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='[{ "key": "value" }, ...]'
              spellCheck={false}
              className="h-80 w-full resize-y rounded-lg border border-[#2a2e3a] bg-[#1a1d27] p-4 font-mono text-sm text-[#e4e6eb] placeholder-[#8b8fa3]/50 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* CSV Output */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-[#8b8fa3]">
                CSV Output
              </label>
              {csvOutput && (
                <div className="flex gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button
                    onClick={download}
                    className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
                  >
                    Download
                  </button>
                </div>
              )}
            </div>
            <textarea
              value={csvOutput}
              readOnly
              placeholder="CSV output will appear here..."
              className="h-80 w-full resize-y rounded-lg border border-[#2a2e3a] bg-[#1a1d27] p-4 font-mono text-sm text-[#e4e6eb] placeholder-[#8b8fa3]/50 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-400">{error}</p>
        )}

        {/* Buttons */}
        <div className="mt-4 flex gap-3">
          <button
            onClick={convert}
            disabled={!jsonInput.trim()}
            className="rounded-lg bg-blue-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Convert
          </button>
          <button
            onClick={() => {
              setJsonInput("");
              setCsvOutput("");
              setError("");
            }}
            className="rounded-lg border border-[#2a2e3a] bg-[#1a1d27] px-5 py-2.5 text-sm font-medium text-[#8b8fa3] hover:text-[#e4e6eb] transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
