"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";

const SCALE_OPTIONS = [
  { label: "1x", value: 1 },
  { label: "2x", value: 2 },
  { label: "3x", value: 3 },
  { label: "4x", value: 4 },
];

export default function SvgToPngClient() {
  const [svgInput, setSvgInput] = useState("");
  const [scale, setScale] = useState(2);
  const [pngUrl, setPngUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null);
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const convertSvgToPng = useCallback(
    (svgText: string) => {
      setError("");
      setPngUrl(null);
      setDimensions(null);

      if (!svgText.trim()) {
        setError("Please provide SVG content.");
        return;
      }

      // Parse SVG to get dimensions
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgText, "image/svg+xml");
      const svgEl = doc.querySelector("svg");
      const parseError = doc.querySelector("parsererror");

      if (parseError || !svgEl) {
        setError("Invalid SVG content. Please check your SVG code.");
        return;
      }

      // Get width/height from SVG attributes or viewBox
      let width = 300;
      let height = 150;

      const viewBox = svgEl.getAttribute("viewBox");
      const svgWidth = svgEl.getAttribute("width");
      const svgHeight = svgEl.getAttribute("height");

      if (viewBox) {
        const parts = viewBox.split(/[\s,]+/).map(Number);
        if (parts.length === 4) {
          width = parts[2];
          height = parts[3];
        }
      }

      if (svgWidth && svgHeight) {
        const pw = parseFloat(svgWidth);
        const ph = parseFloat(svgHeight);
        if (!isNaN(pw) && !isNaN(ph)) {
          width = pw;
          height = ph;
        }
      }

      // Ensure the SVG has explicit width/height for rendering
      if (!svgEl.getAttribute("width")) {
        svgEl.setAttribute("width", String(width));
      }
      if (!svgEl.getAttribute("height")) {
        svgEl.setAttribute("height", String(height));
      }

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgEl);
      const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const outputW = Math.round(width * scale);
        const outputH = Math.round(height * scale);

        canvas.width = outputW;
        canvas.height = outputH;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, outputW, outputH);
        ctx.drawImage(img, 0, 0, outputW, outputH);

        const pngDataUrl = canvas.toDataURL("image/png");
        setPngUrl(pngDataUrl);
        setDimensions({ w: outputW, h: outputH });

        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        setError("Failed to render SVG. Please check your SVG code.");
        URL.revokeObjectURL(url);
      };
      img.src = url;
    },
    [scale]
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setSvgInput(text);
      convertSvgToPng(text);
    };
    reader.readAsText(file);
  };

  const downloadPng = () => {
    if (!pngUrl) return;
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = "converted.png";
    a.click();
  };

  const sampleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <rect width="200" height="200" rx="20" fill="#3B82F6"/>
  <circle cx="100" cy="80" r="35" fill="white"/>
  <rect x="60" y="125" width="80" height="10" rx="5" fill="white"/>
  <rect x="75" y="145" width="50" height="10" rx="5" fill="white" opacity="0.7"/>
</svg>`;

  return (
    <div className="bg-[#0f1117] min-h-full py-12 sm:py-20">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-[#8b8fa3]">
          <Link href="/tools" className="hover:text-blue-500 transition-colors">
            Tools
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#e4e6eb]">SVG to PNG</span>
        </nav>

        <h1 className="text-3xl font-bold tracking-tight text-[#e4e6eb] sm:text-4xl">
          SVG to PNG Converter
        </h1>
        <p className="mt-3 text-[#8b8fa3] max-w-2xl">
          Paste SVG code or upload an SVG file, choose output scale, and
          download as PNG. Everything runs in your browser.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* SVG Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-[#8b8fa3]">
                SVG Input
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSvgInput(sampleSvg);
                    convertSvgToPng(sampleSvg);
                  }}
                  className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
                >
                  Load sample
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
                >
                  Upload file
                </button>
              </div>
            </div>
            <textarea
              value={svgInput}
              onChange={(e) => setSvgInput(e.target.value)}
              placeholder="Paste your SVG code here..."
              spellCheck={false}
              className="h-72 w-full resize-y rounded-lg border border-[#2a2e3a] bg-[#1a1d27] p-4 font-mono text-sm text-[#e4e6eb] placeholder-[#8b8fa3]/50 focus:border-blue-500 focus:outline-none"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept=".svg"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* PNG Preview */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[#8b8fa3]">
              PNG Preview
              {dimensions && (
                <span className="ml-2 text-xs text-[#8b8fa3]">
                  ({dimensions.w} x {dimensions.h}px)
                </span>
              )}
            </label>
            <div className="flex h-72 items-center justify-center rounded-lg border border-[#2a2e3a] bg-[#1a1d27] overflow-hidden">
              {pngUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={pngUrl}
                  alt="PNG preview"
                  className="max-h-full max-w-full object-contain"
                  style={{
                    backgroundImage:
                      "linear-gradient(45deg, #2a2e3a 25%, transparent 25%), linear-gradient(-45deg, #2a2e3a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2e3a 75%), linear-gradient(-45deg, transparent 75%, #2a2e3a 75%)",
                    backgroundSize: "16px 16px",
                    backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                  }}
                />
              ) : (
                <p className="text-sm text-[#8b8fa3]/50">
                  PNG preview will appear here
                </p>
              )}
            </div>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        {/* Scale + Buttons */}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          {/* Scale selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#8b8fa3]">Scale:</span>
            <div className="flex gap-1">
              {SCALE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setScale(opt.value)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    scale === opt.value
                      ? "bg-blue-500 text-white"
                      : "border border-[#2a2e3a] bg-[#1a1d27] text-[#8b8fa3] hover:text-[#e4e6eb]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => convertSvgToPng(svgInput)}
            disabled={!svgInput.trim()}
            className="rounded-lg bg-blue-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Convert
          </button>

          {pngUrl && (
            <button
              onClick={downloadPng}
              className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
            >
              Download PNG
            </button>
          )}

          <button
            onClick={() => {
              setSvgInput("");
              setPngUrl(null);
              setDimensions(null);
              setError("");
            }}
            className="rounded-lg border border-[#2a2e3a] bg-[#1a1d27] px-5 py-2.5 text-sm font-medium text-[#8b8fa3] hover:text-[#e4e6eb] transition-colors"
          >
            Clear
          </button>
        </div>

        {/* Hidden canvas */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
