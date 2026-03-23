"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

function encodeHtmlEntities(str: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "/": "&#x2F;",
    "`": "&#x60;",
    "=": "&#x3D;",
  };
  return str.replace(/[&<>"'`=/]/g, (s) => map[s] || s);
}

function decodeHtmlEntities(str: string): string {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = str;
  return textarea.value;
}

export default function HtmlEntityEncoderClient() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [copied, setCopied] = useState(false);

  const convert = useCallback(() => {
    if (!input.trim()) {
      setOutput("");
      return;
    }
    if (mode === "encode") {
      setOutput(encodeHtmlEntities(input));
    } else {
      setOutput(decodeHtmlEntities(input));
    }
  }, [input, mode]);

  const swap = useCallback(() => {
    setInput(output);
    setOutput("");
    setMode((m) => (m === "encode" ? "decode" : "encode"));
  }, [output]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#0f1117] min-h-full py-12 sm:py-20">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-[#8b8fa3]">
          <Link href="/tools" className="hover:text-blue-500 transition-colors">
            Tools
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#e4e6eb]">HTML Entity Encoder</span>
        </nav>

        <h1 className="text-3xl font-bold tracking-tight text-[#e4e6eb] sm:text-4xl">
          HTML Entity Encoder / Decoder
        </h1>
        <p className="mt-3 text-[#8b8fa3] max-w-2xl">
          Encode special characters to HTML entities or decode HTML entities
          back to their original characters. Useful for safely embedding content
          in HTML.
        </p>

        {/* Mode Toggle */}
        <div className="mt-8 flex gap-2">
          <button
            onClick={() => setMode("encode")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              mode === "encode"
                ? "bg-blue-500 text-white"
                : "border border-[#2a2e3a] bg-[#1a1d27] text-[#8b8fa3] hover:text-[#e4e6eb]"
            }`}
          >
            Encode
          </button>
          <button
            onClick={() => setMode("decode")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              mode === "decode"
                ? "bg-blue-500 text-white"
                : "border border-[#2a2e3a] bg-[#1a1d27] text-[#8b8fa3] hover:text-[#e4e6eb]"
            }`}
          >
            Decode
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Input */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[#8b8fa3]">
              {mode === "encode" ? "Raw HTML / Text" : "Encoded HTML Entities"}
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === "encode"
                  ? '<div class="hello">Hello & "World"</div>'
                  : "&lt;div class=&quot;hello&quot;&gt;Hello &amp; &quot;World&quot;&lt;/div&gt;"
              }
              spellCheck={false}
              className="h-64 w-full resize-y rounded-lg border border-[#2a2e3a] bg-[#1a1d27] p-4 font-mono text-sm text-[#e4e6eb] placeholder-[#8b8fa3]/50 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Output */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-[#8b8fa3]">
                {mode === "encode" ? "Encoded Output" : "Decoded Output"}
              </label>
              {output && (
                <button
                  onClick={copyToClipboard}
                  className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              )}
            </div>
            <textarea
              value={output}
              readOnly
              placeholder="Output will appear here..."
              className="h-64 w-full resize-y rounded-lg border border-[#2a2e3a] bg-[#1a1d27] p-4 font-mono text-sm text-[#e4e6eb] placeholder-[#8b8fa3]/50 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-4 flex gap-3">
          <button
            onClick={convert}
            disabled={!input.trim()}
            className="rounded-lg bg-blue-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mode === "encode" ? "Encode" : "Decode"}
          </button>
          <button
            onClick={swap}
            disabled={!output}
            className="rounded-lg border border-[#2a2e3a] bg-[#1a1d27] px-5 py-2.5 text-sm font-medium text-[#8b8fa3] hover:text-[#e4e6eb] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Swap
          </button>
          <button
            onClick={() => {
              setInput("");
              setOutput("");
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
