"use client";

import { useState } from "react";
import Link from "next/link";

interface DecodedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
}

function base64UrlDecode(str: string): string {
  // Replace base64url chars with base64 chars
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  // Pad with '=' to make length divisible by 4
  const pad = base64.length % 4;
  if (pad) {
    base64 += "=".repeat(4 - pad);
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function decodeJwt(token: string): DecodedJwt {
  const parts = token.trim().split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT: expected 3 parts separated by dots.");
  }

  const header = JSON.parse(base64UrlDecode(parts[0]));
  const payload = JSON.parse(base64UrlDecode(parts[1]));
  const signature = parts[2];

  return { header, payload, signature };
}

function formatTimestamp(ts: number): string {
  const date = new Date(ts * 1000);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
}

function getExpirationStatus(payload: Record<string, unknown>): {
  label: string;
  color: string;
} {
  const exp = payload.exp;
  if (typeof exp !== "number") {
    return { label: "No expiry", color: "text-[#8b8fa3]" };
  }
  const now = Math.floor(Date.now() / 1000);
  if (exp < now) {
    return { label: "Expired", color: "text-red-400" };
  }
  return { label: "Valid", color: "text-green-400" };
}

function JsonBlock({
  label,
  data,
  onCopy,
  copied,
}: {
  label: string;
  data: Record<string, unknown>;
  onCopy: () => void;
  copied: boolean;
}) {
  const json = JSON.stringify(data, null, 2);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-medium text-[#8b8fa3]">{label}</label>
        <button
          onClick={onCopy}
          className="rounded-md border border-[#2a2e3a] bg-[#1a1d27] px-3 py-1.5 text-xs font-medium text-[#8b8fa3] hover:text-[#e4e6eb] transition-colors"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto rounded-lg border border-[#2a2e3a] bg-[#1a1d27] p-4 font-mono text-sm text-[#e4e6eb] whitespace-pre-wrap">
        {highlightJson(json)}
      </pre>
    </div>
  );
}

function highlightJson(json: string): React.ReactNode[] {
  // Simple syntax highlighting for JSON
  const parts: React.ReactNode[] = [];
  const regex =
    /("(?:\\.|[^"\\])*")\s*(:)|("(?:\\.|[^"\\])*")|(true|false|null)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;

  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(json)) !== null) {
    // Add any unmatched text before this match
    if (match.index > lastIndex) {
      parts.push(json.slice(lastIndex, match.index));
    }

    if (match[1] && match[2]) {
      // Key
      parts.push(
        <span key={key++} className="text-[#7dd3fc]">
          {match[1]}
        </span>
      );
      parts.push(match[2]);
    } else if (match[3]) {
      // String value
      parts.push(
        <span key={key++} className="text-[#86efac]">
          {match[3]}
        </span>
      );
    } else if (match[4]) {
      // Boolean / null
      parts.push(
        <span key={key++} className="text-[#c4b5fd]">
          {match[4]}
        </span>
      );
    } else if (match[5]) {
      // Number
      parts.push(
        <span key={key++} className="text-[#fca5a5]">
          {match[5]}
        </span>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < json.length) {
    parts.push(json.slice(lastIndex));
  }

  return parts;
}

export default function JwtDecoderClient() {
  const [input, setInput] = useState("");
  const [decoded, setDecoded] = useState<DecodedJwt | null>(null);
  const [error, setError] = useState("");
  const [copiedSection, setCopiedSection] = useState<string>("");

  function handleDecode() {
    setError("");
    setDecoded(null);
    setCopiedSection("");

    if (!input.trim()) {
      setError("Please enter a JWT token to decode.");
      return;
    }

    try {
      const result = decodeJwt(input);
      setDecoded(result);
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "Failed to decode JWT token."
      );
    }
  }

  function handleCopy(section: string, text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(""), 2000);
    });
  }

  function handleClear() {
    setInput("");
    setDecoded(null);
    setError("");
    setCopiedSection("");
  }

  const expirationStatus = decoded
    ? getExpirationStatus(decoded.payload)
    : null;

  return (
    <div className="bg-[#0f1117] min-h-full py-12 sm:py-20">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-[#8b8fa3]">
          <Link href="/tools" className="hover:text-blue-500 transition-colors">
            Tools
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#e4e6eb]">JWT Decoder</span>
        </nav>

        <h1 className="text-3xl font-bold tracking-tight text-[#e4e6eb] sm:text-4xl">
          JWT Decoder
        </h1>
        <p className="mt-3 text-[#8b8fa3] max-w-2xl">
          Paste a JSON Web Token to decode and inspect its header, payload, and
          signature. Everything runs client-side — your token never leaves your
          browser.
        </p>

        {/* Input */}
        <div className="mt-8">
          <label className="mb-2 block text-sm font-medium text-[#8b8fa3]">
            JWT Token
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
            spellCheck={false}
            className="h-32 w-full resize-y rounded-lg border border-[#2a2e3a] bg-[#1a1d27] p-4 font-mono text-sm text-[#e4e6eb] placeholder-[#8b8fa3]/50 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Buttons */}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleDecode}
            className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
          >
            Decode
          </button>
          <button
            onClick={handleClear}
            className="rounded-lg border border-[#2a2e3a] bg-[#1a1d27] px-5 py-2.5 text-sm font-medium text-[#8b8fa3] hover:text-[#e4e6eb] hover:border-blue-500/50 transition-colors"
          >
            Clear
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Decoded output */}
        {decoded && (
          <div className="mt-8 space-y-6">
            {/* Status bar */}
            <div className="flex flex-wrap items-center gap-4 rounded-lg border border-[#2a2e3a] bg-[#1a1d27] px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#8b8fa3]">Algorithm:</span>
                <span className="text-sm font-medium text-[#e4e6eb]">
                  {String(decoded.header.alg || "Unknown")}
                </span>
              </div>
              <div className="h-4 w-px bg-[#2a2e3a]" />
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#8b8fa3]">Type:</span>
                <span className="text-sm font-medium text-[#e4e6eb]">
                  {String(decoded.header.typ || "Unknown")}
                </span>
              </div>
              <div className="h-4 w-px bg-[#2a2e3a]" />
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#8b8fa3]">Status:</span>
                <span
                  className={`text-sm font-medium ${expirationStatus?.color}`}
                >
                  {expirationStatus?.label}
                </span>
              </div>
              {typeof decoded.payload.iat === "number" && (
                <>
                  <div className="h-4 w-px bg-[#2a2e3a]" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#8b8fa3]">Issued:</span>
                    <span className="text-sm text-[#e4e6eb]">
                      {formatTimestamp(decoded.payload.iat as number)}
                    </span>
                  </div>
                </>
              )}
              {typeof decoded.payload.exp === "number" && (
                <>
                  <div className="h-4 w-px bg-[#2a2e3a]" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#8b8fa3]">Expires:</span>
                    <span className="text-sm text-[#e4e6eb]">
                      {formatTimestamp(decoded.payload.exp as number)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Header */}
            <JsonBlock
              label="Header"
              data={decoded.header}
              onCopy={() =>
                handleCopy(
                  "header",
                  JSON.stringify(decoded.header, null, 2)
                )
              }
              copied={copiedSection === "header"}
            />

            {/* Payload */}
            <JsonBlock
              label="Payload"
              data={decoded.payload}
              onCopy={() =>
                handleCopy(
                  "payload",
                  JSON.stringify(decoded.payload, null, 2)
                )
              }
              copied={copiedSection === "payload"}
            />

            {/* Signature */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-[#8b8fa3]">
                  Signature
                </label>
                <button
                  onClick={() => handleCopy("signature", decoded.signature)}
                  className="rounded-md border border-[#2a2e3a] bg-[#1a1d27] px-3 py-1.5 text-xs font-medium text-[#8b8fa3] hover:text-[#e4e6eb] transition-colors"
                >
                  {copiedSection === "signature" ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre className="overflow-x-auto rounded-lg border border-[#2a2e3a] bg-[#1a1d27] p-4 font-mono text-sm text-[#8b8fa3] break-all whitespace-pre-wrap">
                {decoded.signature}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
