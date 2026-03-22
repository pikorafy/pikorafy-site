"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface ColorStop {
  color: string;
  position: number;
}

export default function CssGradientGeneratorClient() {
  const [type, setType] = useState<"linear" | "radial">("linear");
  const [angle, setAngle] = useState(135);
  const [stops, setStops] = useState<ColorStop[]>([
    { color: "#3B82F6", position: 0 },
    { color: "#8B5CF6", position: 100 },
  ]);
  const [copied, setCopied] = useState(false);

  const cssValue = useMemo(() => {
    const stopsStr = stops
      .map((s) => `${s.color} ${s.position}%`)
      .join(", ");
    if (type === "linear") {
      return `linear-gradient(${angle}deg, ${stopsStr})`;
    }
    return `radial-gradient(circle, ${stopsStr})`;
  }, [type, angle, stops]);

  const cssCode = `background: ${cssValue};`;

  function updateStop(index: number, field: keyof ColorStop, value: string | number) {
    setStops((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  }

  function addStop() {
    const lastPos = stops[stops.length - 1]?.position ?? 0;
    const newPos = Math.min(100, lastPos + 10);
    setStops((prev) => [...prev, { color: "#10B981", position: newPos }]);
  }

  function removeStop(index: number) {
    if (stops.length <= 2) return;
    setStops((prev) => prev.filter((_, i) => i !== index));
  }

  function handleCopy() {
    navigator.clipboard.writeText(cssCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // Preset gradients
  const presets = [
    { stops: [{ color: "#667eea", position: 0 }, { color: "#764ba2", position: 100 }], angle: 135 },
    { stops: [{ color: "#f093fb", position: 0 }, { color: "#f5576c", position: 100 }], angle: 135 },
    { stops: [{ color: "#4facfe", position: 0 }, { color: "#00f2fe", position: 100 }], angle: 135 },
    { stops: [{ color: "#43e97b", position: 0 }, { color: "#38f9d7", position: 100 }], angle: 135 },
    { stops: [{ color: "#fa709a", position: 0 }, { color: "#fee140", position: 100 }], angle: 135 },
    { stops: [{ color: "#a18cd1", position: 0 }, { color: "#fbc2eb", position: 100 }], angle: 135 },
  ];

  return (
    <div className="bg-[#0f1117] min-h-full py-12 sm:py-20">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-[#8b8fa3]">
          <Link href="/tools" className="hover:text-blue-500 transition-colors">
            Tools
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#e4e6eb]">CSS Gradient Generator</span>
        </nav>

        <h1 className="text-3xl font-bold tracking-tight text-[#e4e6eb] sm:text-4xl">
          CSS Gradient Generator
        </h1>
        <p className="mt-3 text-[#8b8fa3] max-w-2xl">
          Build beautiful gradients visually. Pick colors, set angle, and copy
          the CSS code.
        </p>

        {/* Preview */}
        <div
          className="mt-8 h-48 w-full rounded-xl border border-[#2a2e3a]"
          style={{ background: cssValue }}
        />

        {/* Presets */}
        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-[#8b8fa3]">Presets</p>
          <div className="flex flex-wrap gap-3">
            {presets.map((preset, i) => {
              const bg = `linear-gradient(135deg, ${preset.stops.map((s) => `${s.color} ${s.position}%`).join(", ")})`;
              return (
                <button
                  key={i}
                  onClick={() => {
                    setStops(preset.stops);
                    setAngle(preset.angle);
                    setType("linear");
                  }}
                  className="h-10 w-16 rounded-lg border border-[#2a2e3a] transition-transform hover:scale-110"
                  style={{ background: bg }}
                />
              );
            })}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Controls */}
          <div className="space-y-6">
            {/* Type */}
            <div className="flex items-center gap-4">
              <label className="text-sm text-[#8b8fa3]">Type:</label>
              <button
                onClick={() => setType("linear")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  type === "linear"
                    ? "bg-blue-500 text-white"
                    : "border border-[#2a2e3a] bg-[#1a1d27] text-[#8b8fa3] hover:text-[#e4e6eb]"
                }`}
              >
                Linear
              </button>
              <button
                onClick={() => setType("radial")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  type === "radial"
                    ? "bg-blue-500 text-white"
                    : "border border-[#2a2e3a] bg-[#1a1d27] text-[#8b8fa3] hover:text-[#e4e6eb]"
                }`}
              >
                Radial
              </button>
            </div>

            {/* Angle (linear only) */}
            {type === "linear" && (
              <div className="flex items-center gap-3">
                <label className="text-sm text-[#8b8fa3]">
                  Angle: {angle}&deg;
                </label>
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={angle}
                  onChange={(e) => setAngle(Number(e.target.value))}
                  className="w-48 accent-blue-500"
                />
              </div>
            )}

            {/* Color stops */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-[#8b8fa3]">Color Stops</p>
              {stops.map((stop, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input
                    type="color"
                    value={stop.color}
                    onChange={(e) => updateStop(i, "color", e.target.value)}
                    className="h-9 w-10 cursor-pointer rounded border border-[#2a2e3a] bg-[#1a1d27]"
                  />
                  <input
                    type="text"
                    value={stop.color}
                    onChange={(e) => updateStop(i, "color", e.target.value)}
                    className="w-24 rounded-lg border border-[#2a2e3a] bg-[#1a1d27] px-3 py-2 text-sm text-[#e4e6eb] focus:border-blue-500 focus:outline-none"
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={stop.position}
                    onChange={(e) =>
                      updateStop(i, "position", Number(e.target.value))
                    }
                    className="w-20 rounded-lg border border-[#2a2e3a] bg-[#1a1d27] px-3 py-2 text-sm text-[#e4e6eb] focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-xs text-[#8b8fa3]">%</span>
                  {stops.length > 2 && (
                    <button
                      onClick={() => removeStop(i)}
                      className="text-sm text-red-400 hover:text-red-300 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addStop}
                className="rounded-lg border border-dashed border-[#2a2e3a] px-4 py-2 text-sm text-[#8b8fa3] hover:border-blue-500/50 hover:text-[#e4e6eb] transition-colors"
              >
                + Add Color Stop
              </button>
            </div>
          </div>

          {/* CSS Output */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-[#8b8fa3]">
                CSS Code
              </label>
              <button
                onClick={handleCopy}
                className="rounded-md border border-[#2a2e3a] bg-[#1a1d27] px-3 py-1.5 text-xs font-medium text-[#8b8fa3] hover:text-[#e4e6eb] transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="rounded-lg border border-[#2a2e3a] bg-[#1a1d27] p-4">
              <code className="text-sm text-[#e4e6eb] break-all">
                {cssCode}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
