"use client";

import { useState } from "react";

export default function UrlEncoderClient() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [encodeComponent, setEncodeComponent] = useState(true);

  const handleEncode = () => {
    setMode("encode");
    setError("");
    try {
      const result = encodeComponent
        ? encodeURIComponent(input)
        : encodeURI(input);
      setOutput(result);
    } catch {
      setError("Failed to encode the input string.");
      setOutput("");
    }
  };

  const handleDecode = () => {
    setMode("decode");
    setError("");
    try {
      const result = encodeComponent
        ? decodeURIComponent(input)
        : decodeURI(input);
      setOutput(result);
    } catch {
      setError(
        "Failed to decode the input string. Make sure it contains valid percent-encoded characters."
      );
      setOutput("");
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const swapValues = () => {
    setInput(output);
    setOutput("");
    setError("");
  };

  return (
    <div className="bg-[#0f1117] min-h-full py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          URL Encoder / Decoder
        </h1>
        <p className="mt-4 text-lg text-[#8b8fa3]">
          Encode or decode URLs and query parameters. Handles all special
          characters with proper percent-encoding.
        </p>

        <div className="mt-10 space-y-6">
          {/* Input */}
          <div className="rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-[#e4e6eb]">
                Input
              </label>
              <span className="text-xs text-[#555]">
                {input.length} characters
              </span>
            </div>
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError("");
              }}
              placeholder="Enter text or URL to encode/decode..."
              className="w-full rounded-lg border border-[#2a2e3a] bg-[#0f1117] px-4 py-3 text-sm text-[#e4e6eb] font-mono placeholder-[#555] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              rows={5}
              spellCheck={false}
            />
          </div>

          {/* Options and Buttons */}
          <div className="rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-2 text-sm text-[#e4e6eb] cursor-pointer">
                <input
                  type="checkbox"
                  checked={encodeComponent}
                  onChange={(e) => setEncodeComponent(e.target.checked)}
                  className="rounded border-[#2a2e3a] bg-[#0f1117] text-blue-500 focus:ring-blue-500"
                />
                Component mode{" "}
                <span className="text-[#8b8fa3]">
                  (encodeURIComponent — encodes all special characters)
                </span>
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={handleEncode}
                className="rounded-lg bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1a1d27]"
              >
                Encode
              </button>
              <button
                onClick={handleDecode}
                className="rounded-lg border border-blue-500 px-6 py-2.5 text-sm font-semibold text-blue-400 transition-colors hover:bg-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1a1d27]"
              >
                Decode
              </button>
              <button
                onClick={swapValues}
                disabled={!output}
                className="rounded-lg border border-[#2a2e3a] px-4 py-2.5 text-sm font-medium text-[#8b8fa3] transition-colors hover:border-[#3a3e4a] hover:text-[#e4e6eb] disabled:opacity-40 disabled:cursor-not-allowed"
                title="Move output to input"
              >
                <svg
                  className="h-4 w-4 inline mr-1.5 -mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                  />
                </svg>
                Swap
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Output */}
          {output && (
            <div className="rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-[#e4e6eb]">
                  {mode === "encode" ? "Encoded" : "Decoded"} Output
                </label>
                <button
                  onClick={copyToClipboard}
                  className="rounded-lg border border-[#2a2e3a] bg-[#0f1117] px-4 py-1.5 text-xs font-medium text-[#e4e6eb] transition-colors hover:border-blue-500/50 hover:text-blue-400"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <textarea
                value={output}
                readOnly
                className="w-full rounded-lg border border-[#2a2e3a] bg-[#0f1117] px-4 py-3 text-sm text-[#e4e6eb] font-mono focus:outline-none resize-none"
                rows={5}
              />
              <p className="mt-2 text-xs text-[#555]">
                {output.length} characters
              </p>
            </div>
          )}

          {/* Reference */}
          <div className="rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-6">
            <h2 className="text-sm font-semibold text-[#e4e6eb] uppercase tracking-wider mb-3">
              Common Encodings
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
              {[
                ["Space", "%20"],
                ["!", "%21"],
                ["#", "%23"],
                ["$", "%24"],
                ["&", "%26"],
                ["'", "%27"],
                ["(", "%28"],
                [")", "%29"],
                ["+", "%2B"],
                [",", "%2C"],
                ["/", "%2F"],
                [":", "%3A"],
                [";", "%3B"],
                ["=", "%3D"],
                ["?", "%3F"],
                ["@", "%40"],
                ["[", "%5B"],
                ["]", "%5D"],
              ].map(([char, code]) => (
                <div
                  key={code}
                  className="flex items-center justify-between rounded-md bg-[#0f1117] border border-[#2a2e3a] px-3 py-1.5"
                >
                  <span className="text-[#e4e6eb]">{char}</span>
                  <span className="text-[#8b8fa3]">{code}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
