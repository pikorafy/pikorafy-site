"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface RGB {
  r: number;
  g: number;
  b: number;
}
interface HSL {
  h: number;
  s: number;
  l: number;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (n: number) =>
    clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgb(hex: string): RGB | null {
  const clean = hex.replace(/^#/, "");
  let r: number, g: number, b: number;
  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  } else if (clean.length === 6) {
    r = parseInt(clean.slice(0, 2), 16);
    g = parseInt(clean.slice(2, 4), 16);
    b = parseInt(clean.slice(4, 6), 16);
  } else {
    return null;
  }
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return { r, g, b };
}

function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255,
    gn = g / 255,
    bn = b / 255;
  const max = Math.max(rn, gn, bn),
    min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0,
    s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
    else if (max === gn) h = ((bn - rn) / d + 2) / 6;
    else h = ((rn - gn) / d + 4) / 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToRgb({ h, s, l }: HSL): RGB {
  const sn = s / 100,
    ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let rn = 0,
    gn = 0,
    bn = 0;

  if (h < 60) {
    rn = c;
    gn = x;
  } else if (h < 120) {
    rn = x;
    gn = c;
  } else if (h < 180) {
    gn = c;
    bn = x;
  } else if (h < 240) {
    gn = x;
    bn = c;
  } else if (h < 300) {
    rn = x;
    bn = c;
  } else {
    rn = c;
    bn = x;
  }

  return {
    r: Math.round((rn + m) * 255),
    g: Math.round((gn + m) * 255),
    b: Math.round((bn + m) * 255),
  };
}

function parseColor(input: string): RGB | null {
  const trimmed = input.trim();

  // HEX
  const hexMatch = trimmed.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (hexMatch) return hexToRgb(hexMatch[1]);

  // rgb(r, g, b) or r, g, b
  const rgbMatch = trimmed.match(
    /^(?:rgb\s*\(\s*)?(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*\)?$/i
  );
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]),
      g = parseInt(rgbMatch[2]),
      b = parseInt(rgbMatch[3]);
    if (r <= 255 && g <= 255 && b <= 255) return { r, g, b };
  }

  // hsl(h, s%, l%) or h, s%, l%
  const hslMatch = trimmed.match(
    /^(?:hsl\s*\(\s*)?(\d{1,3})\s*[,\s]\s*(\d{1,3})%?\s*[,\s]\s*(\d{1,3})%?\s*\)?$/i
  );
  if (hslMatch) {
    const h = parseInt(hslMatch[1]),
      s = parseInt(hslMatch[2]),
      l = parseInt(hslMatch[3]);
    if (h <= 360 && s <= 100 && l <= 100) return hslToRgb({ h, s, l });
  }

  return null;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-[#2a2e3a] bg-[#0f1117] px-4 py-3">
      <div>
        <div className="text-xs text-[#8b8fa3] mb-1">{label}</div>
        <div className="font-mono text-sm text-[#e4e6eb]">{text}</div>
      </div>
      <button
        onClick={handleCopy}
        className="shrink-0 ml-4 rounded-md border border-[#2a2e3a] bg-[#1a1d27] px-3 py-1.5 text-xs font-medium text-[#8b8fa3] hover:text-[#e4e6eb] transition-colors"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}

export default function ColorConverterClient() {
  const [input, setInput] = useState("#3B82F6");
  const [rgb, setRgb] = useState<RGB | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!input.trim()) {
      setRgb(null);
      setError("");
      return;
    }
    const parsed = parseColor(input);
    if (parsed) {
      setRgb(parsed);
      setError("");
    } else {
      setRgb(null);
      setError("Could not parse color. Try HEX (#ff0000), RGB (255, 0, 0), or HSL (0, 100%, 50%).");
    }
  }, [input]);

  const hex = rgb ? rgbToHex(rgb) : "";
  const hsl = rgb ? rgbToHsl(rgb) : null;

  return (
    <div className="bg-[#0f1117] min-h-full py-12 sm:py-20">
      <div className="mx-auto max-w-2xl px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-[#8b8fa3]">
          <Link href="/tools" className="hover:text-blue-500 transition-colors">
            Tools
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#e4e6eb]">Color Converter</span>
        </nav>

        <h1 className="text-3xl font-bold tracking-tight text-[#e4e6eb] sm:text-4xl">
          Color Converter
        </h1>
        <p className="mt-3 text-[#8b8fa3]">
          Enter a color in any format and see it converted to HEX, RGB, HSL, and
          CSS custom property syntax.
        </p>

        {/* Input */}
        <div className="mt-8 rounded-lg border border-[#2a2e3a] bg-[#1a1d27] p-6">
          <label
            htmlFor="color-input"
            className="block text-sm font-medium text-[#8b8fa3] mb-2"
          >
            Color Input
          </label>
          <div className="flex gap-3">
            <input
              id="color-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="#3B82F6, rgb(59,130,246), or hsl(217,91%,60%)"
              className="flex-1 rounded-lg border border-[#2a2e3a] bg-[#0f1117] px-4 py-3 font-mono text-sm text-[#e4e6eb] placeholder-[#8b8fa3]/50 focus:border-blue-500 focus:outline-none"
            />
            {rgb && (
              <input
                type="color"
                value={hex}
                onChange={(e) => setInput(e.target.value)}
                className="h-12 w-12 shrink-0 cursor-pointer rounded-lg border border-[#2a2e3a] bg-transparent p-1"
              />
            )}
          </div>

          {/* Quick presets */}
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              "#EF4444",
              "#F59E0B",
              "#10B981",
              "#3B82F6",
              "#8B5CF6",
              "#EC4899",
              "#FFFFFF",
              "#000000",
            ].map((c) => (
              <button
                key={c}
                onClick={() => setInput(c)}
                className="h-7 w-7 rounded-md border border-[#2a2e3a] transition-transform hover:scale-110"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Preview & Formats */}
        {rgb && hsl && (
          <div className="mt-6 space-y-4">
            {/* Color Preview */}
            <div className="overflow-hidden rounded-lg border border-[#2a2e3a]">
              <div className="h-32 w-full" style={{ backgroundColor: hex }} />
              <div className="bg-[#1a1d27] px-4 py-3 text-center">
                <span className="font-mono text-sm text-[#e4e6eb]">{hex}</span>
              </div>
            </div>

            {/* All formats */}
            <div className="space-y-3">
              <CopyButton label="HEX" text={hex} />
              <CopyButton
                label="RGB"
                text={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`}
              />
              <CopyButton
                label="HSL"
                text={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`}
              />
              <CopyButton
                label="CSS Variable"
                text={`--color: ${hex};`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
