"use client";

import { useState } from "react";
import Link from "next/link";

function isBase64(str: string): boolean {
  if (!str.trim()) return false;
  const trimmed = str.trim();
  // Base64 regex: only base64 chars, proper padding, length divisible by 4
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(trimmed)) return false;
  if (trimmed.length % 4 !== 0) return false;
  try {
    atob(trimmed);
    return true;
  } catch {
    return false;
  }
}

export default function Base64Client() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode" | "auto">("auto");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [lastAction, setLastAction] = useState<"encoded" | "decoded" | "">("");

  function encode(text: string): string {
    // Handle UTF-8 properly
    const bytes = new TextEncoder().encode(text);
    let binary = "";
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary);
  }

  function decode(b64: string): string {
    const binary = atob(b64.trim());
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }

  function handleEncode() {
    setError("");
    setCopied(false);
    if (!input.trim()) {
      setError("Please enter some text to encode.");
      setOutput("");
      return;
    }
    try {
      setOutput(encode(input));
      setLastAction("encoded");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to encode.");
      setOutput("");
    }
  }

  function handleDecode() {
    setError("");
    setCopied(false);
    if (!input.trim()) {
      setError("Please enter a Base64 string to decode.");
      setOutput("");
      return;
    }
    try {
      setOutput(decode(input));
      setLastAction("decoded");
    } catch (e: unknown) {
      setError(
        "Invalid Base64 string. Make sure the input is properly encoded."
      );
      setOutput("");
    }
  }

  function handleAuto() {
    setError("");
    setCopied(false);
    if (!input.trim()) {
      setError("Please enter some text.");
      setOutput("");
      return;
    }
    if (isBase64(input.trim())) {
      try {
        setOutput(decode(input));
        setLastAction("decoded");
        return;
      } catch {
        // Fall through to encode
      }
    }
    try {
      setOutput(encode(input));
      setLastAction("encoded");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Processing failed.");
      setOutput("");
    }
  }

  function handleProcess() {
    if (mode === "encode") handleEncode();
    else if (mode === "decode") handleDecode();
    else handleAuto();
  }

  function handleCopy() {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleSwap() {
    setInput(output);
    setOutput("");
    setError("");
    setCopied(false);
    setLastAction("");
  }

  return (
    <div className="bg-[#0f1117] min-h-full py-12 sm:py-20">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-[#8b8fa3]">
          <Link href="/tools" className="hover:text-blue-500 transition-colors">
            Tools
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#e4e6eb]">Base64 Encoder / Decoder</span>
        </nav>

        <h1 className="text-3xl font-bold tracking-tight text-[#e4e6eb] sm:text-4xl">
          Base64 Encoder / Decoder
        </h1>
        <p className="mt-3 text-[#8b8fa3] max-w-2xl">
          Encode text to Base64 or decode Base64 back to text. Auto-detect mode
          guesses the right direction for you.
        </p>

        {/* Mode selector */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          {(["auto", "encode", "decode"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                mode === m
                  ? "bg-blue-500 text-white"
                  : "border border-[#2a2e3a] bg-[#1a1d27] text-[#8b8fa3] hover:text-[#e4e6eb] hover:border-blue-500/50"
              }`}
            >
              {m === "auto" ? "Auto-detect" : m === "encode" ? "Encode" : "Decode"}
            </button>
          ))}

          <button
            onClick={handleProcess}
            className="ml-auto rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
          >
            {mode === "auto"
              ? "Process"
              : mode === "encode"
              ? "Encode"
              : "Decode"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Textareas */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#8b8fa3]">
              Input
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter text or Base64 string..."
              spellCheck={false}
              className="h-64 w-full resize-y rounded-lg border border-[#2a2e3a] bg-[#1a1d27] p-4 font-mono text-sm text-[#e4e6eb] placeholder-[#8b8fa3]/50 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Swap button between textareas on mobile / in center on desktop */}
          <div className="flex items-center justify-center lg:hidden">
            <button
              onClick={handleSwap}
              className="rounded-full border border-[#2a2e3a] bg-[#1a1d27] p-2 text-[#8b8fa3] hover:text-[#e4e6eb] transition-colors"
              title="Swap input and output"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
            </button>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-[#8b8fa3]">
                Output
                {lastAction && (
                  <span className="ml-2 text-xs text-blue-500">
                    ({lastAction})
                  </span>
                )}
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSwap}
                  disabled={!output}
                  className="hidden lg:block rounded-md border border-[#2a2e3a] bg-[#1a1d27] px-3 py-1.5 text-xs font-medium text-[#8b8fa3] hover:text-[#e4e6eb] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Swap
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!output}
                  className="rounded-md border border-[#2a2e3a] bg-[#1a1d27] px-3 py-1.5 text-xs font-medium text-[#8b8fa3] hover:text-[#e4e6eb] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
            <textarea
              value={output}
              readOnly
              spellCheck={false}
              placeholder="Result will appear here..."
              className="h-64 w-full resize-y rounded-lg border border-[#2a2e3a] bg-[#1a1d27] p-4 font-mono text-sm text-[#e4e6eb] placeholder-[#8b8fa3]/50 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
