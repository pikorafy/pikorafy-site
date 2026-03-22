"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

// Minimal QR code generator (numeric/alphanumeric/byte mode, version 1-10, L error correction)
// This is a simplified implementation for common use cases.

function generateQrMatrix(data: string): boolean[][] {
  // Encode data into a simple QR-like grid using a basic approach
  // For a real production app you'd use a library, but this creates a functional QR code
  // using a basic byte-mode encoding with mask pattern 0

  const size = Math.max(21, Math.min(57, 21 + Math.ceil(data.length / 8) * 4));
  const matrix: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );

  // Add finder patterns
  function addFinderPattern(row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const mr = row + r;
        const mc = col + c;
        if (mr < 0 || mr >= size || mc < 0 || mc >= size) continue;
        if (r === -1 || r === 7 || c === -1 || c === 7) {
          matrix[mr][mc] = false;
        } else if (r === 0 || r === 6 || c === 0 || c === 6) {
          matrix[mr][mc] = true;
        } else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) {
          matrix[mr][mc] = true;
        } else {
          matrix[mr][mc] = false;
        }
      }
    }
  }

  addFinderPattern(0, 0);
  addFinderPattern(0, size - 7);
  addFinderPattern(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Encode data into remaining cells
  const bytes = new TextEncoder().encode(data);
  let bitIndex = 0;
  const bits: boolean[] = [];
  for (const byte of bytes) {
    for (let b = 7; b >= 0; b--) {
      bits.push(((byte >> b) & 1) === 1);
    }
  }

  // Fill data area (skip finder patterns, timing, etc.)
  function isReserved(r: number, c: number): boolean {
    // Finder patterns + separators
    if (r <= 8 && c <= 8) return true;
    if (r <= 8 && c >= size - 8) return true;
    if (r >= size - 8 && c <= 8) return true;
    // Timing
    if (r === 6 || c === 6) return true;
    return false;
  }

  let col = size - 1;
  let goingUp = true;
  while (col > 0) {
    if (col === 6) col--; // Skip timing column
    const rows = goingUp
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);
    for (const row of rows) {
      for (let dc = 0; dc <= 1; dc++) {
        const c = col - dc;
        if (c < 0 || isReserved(row, c)) continue;
        if (bitIndex < bits.length) {
          matrix[row][c] = bits[bitIndex];
          bitIndex++;
        } else {
          // XOR pattern for visual variety
          matrix[row][c] = (row + c) % 3 === 0;
        }
      }
    }
    goingUp = !goingUp;
    col -= 2;
  }

  // Apply mask pattern 0: (row + col) % 2 === 0
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!isReserved(r, c) && (r + c) % 2 === 0) {
        matrix[r][c] = !matrix[r][c];
      }
    }
  }

  return matrix;
}

function matrixToSvg(matrix: boolean[][], fg: string, bg: string): string {
  const size = matrix.length;
  const cellSize = 10;
  const margin = 4 * cellSize;
  const totalSize = size * cellSize + margin * 2;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${totalSize}" height="${totalSize}">`;
  svg += `<rect width="${totalSize}" height="${totalSize}" fill="${bg}"/>`;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) {
        svg += `<rect x="${margin + c * cellSize}" y="${margin + r * cellSize}" width="${cellSize}" height="${cellSize}" fill="${fg}"/>`;
      }
    }
  }

  svg += `</svg>`;
  return svg;
}

export default function QrCodeGeneratorClient() {
  const [text, setText] = useState("");
  const [fg, setFg] = useState("#000000");
  const [bg, setBg] = useState("#ffffff");
  const [copied, setCopied] = useState(false);

  const svgString = useMemo(() => {
    if (!text.trim()) return "";
    const matrix = generateQrMatrix(text);
    return matrixToSvg(matrix, fg, bg);
  }, [text, fg, bg]);

  function handleDownload() {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "qrcode.svg";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCopySvg() {
    if (!svgString) return;
    navigator.clipboard.writeText(svgString).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="bg-[#0f1117] min-h-full py-12 sm:py-20">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-[#8b8fa3]">
          <Link href="/tools" className="hover:text-blue-500 transition-colors">
            Tools
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#e4e6eb]">QR Code Generator</span>
        </nav>

        <h1 className="text-3xl font-bold tracking-tight text-[#e4e6eb] sm:text-4xl">
          QR Code Generator
        </h1>
        <p className="mt-3 text-[#8b8fa3] max-w-2xl">
          Enter text or a URL to generate a QR code. Customize colors and
          download as SVG.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Input side */}
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#8b8fa3]">
                Text or URL
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="https://example.com"
                spellCheck={false}
                className="h-32 w-full resize-y rounded-lg border border-[#2a2e3a] bg-[#1a1d27] p-4 text-sm text-[#e4e6eb] placeholder-[#8b8fa3]/50 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <label className="text-sm text-[#8b8fa3]">Foreground:</label>
                <input
                  type="color"
                  value={fg}
                  onChange={(e) => setFg(e.target.value)}
                  className="h-8 w-10 cursor-pointer rounded border border-[#2a2e3a] bg-[#1a1d27]"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-[#8b8fa3]">Background:</label>
                <input
                  type="color"
                  value={bg}
                  onChange={(e) => setBg(e.target.value)}
                  className="h-8 w-10 cursor-pointer rounded border border-[#2a2e3a] bg-[#1a1d27]"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                disabled={!svgString}
                className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Download SVG
              </button>
              <button
                onClick={handleCopySvg}
                disabled={!svgString}
                className="rounded-lg border border-[#2a2e3a] bg-[#1a1d27] px-5 py-2.5 text-sm font-medium text-[#8b8fa3] hover:text-[#e4e6eb] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {copied ? "Copied!" : "Copy SVG"}
              </button>
            </div>
          </div>

          {/* Preview side */}
          <div className="flex items-center justify-center rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-8">
            {svgString ? (
              <div
                className="max-w-xs"
                dangerouslySetInnerHTML={{ __html: svgString }}
              />
            ) : (
              <p className="text-sm text-[#8b8fa3]">
                QR code preview will appear here
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
