"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function ImageCompressorClient() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState("");
  const [compressedUrl, setCompressedUrl] = useState("");
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [quality, setQuality] = useState(0.7);
  const [outputFormat, setOutputFormat] = useState<"image/jpeg" | "image/webp">(
    "image/jpeg"
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compress = useCallback(
    (file: File, q: number, format: string) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (!blob) return;
            if (compressedUrl) URL.revokeObjectURL(compressedUrl);
            const newUrl = URL.createObjectURL(blob);
            setCompressedUrl(newUrl);
            setCompressedSize(blob.size);
          },
          format,
          q
        );
        URL.revokeObjectURL(url);
      };
      img.src = url;
    },
    [compressedUrl]
  );

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    setOriginalFile(file);
    setOriginalSize(file.size);
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    compress(file, quality, outputFormat);
  }

  function handleQualityChange(q: number) {
    setQuality(q);
    if (originalFile) compress(originalFile, q, outputFormat);
  }

  function handleFormatChange(fmt: "image/jpeg" | "image/webp") {
    setOutputFormat(fmt);
    if (originalFile) compress(originalFile, quality, fmt);
  }

  function handleDownload() {
    if (!compressedUrl) return;
    const ext = outputFormat === "image/webp" ? "webp" : "jpg";
    const a = document.createElement("a");
    a.href = compressedUrl;
    a.download = `compressed.${ext}`;
    a.click();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  const savings =
    originalSize > 0
      ? ((1 - compressedSize / originalSize) * 100).toFixed(1)
      : "0";

  return (
    <div className="bg-[#0f1117] min-h-full py-12 sm:py-20">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-[#8b8fa3]">
          <Link href="/tools" className="hover:text-blue-500 transition-colors">
            Tools
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#e4e6eb]">Image Compressor</span>
        </nav>

        <h1 className="text-3xl font-bold tracking-tight text-[#e4e6eb] sm:text-4xl">
          Image Compressor
        </h1>
        <p className="mt-3 text-[#8b8fa3] max-w-2xl">
          Compress images right in your browser. No uploads to any server.
          Adjust quality and download the compressed result.
        </p>

        {/* Upload area */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="mt-8 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#2a2e3a] bg-[#1a1d27] p-12 transition-colors hover:border-blue-500/50"
        >
          <svg
            className="mb-3 h-10 w-10 text-[#8b8fa3]"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
          <p className="text-sm text-[#8b8fa3]">
            Click or drag & drop an image here
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>

        {originalFile && (
          <>
            {/* Controls */}
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <label className="text-sm text-[#8b8fa3]">
                  Quality: {Math.round(quality * 100)}%
                </label>
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={quality}
                  onChange={(e) => handleQualityChange(Number(e.target.value))}
                  className="w-40 accent-blue-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-[#8b8fa3]">Format:</label>
                <select
                  value={outputFormat}
                  onChange={(e) =>
                    handleFormatChange(
                      e.target.value as "image/jpeg" | "image/webp"
                    )
                  }
                  className="rounded-lg border border-[#2a2e3a] bg-[#1a1d27] px-3 py-2 text-sm text-[#e4e6eb] focus:border-blue-500 focus:outline-none"
                >
                  <option value="image/jpeg">JPEG</option>
                  <option value="image/webp">WebP</option>
                </select>
              </div>
              <button
                onClick={handleDownload}
                className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
              >
                Download Compressed
              </button>
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-4 text-center">
                <p className="text-lg font-bold text-[#e4e6eb]">
                  {formatBytes(originalSize)}
                </p>
                <p className="mt-1 text-xs text-[#8b8fa3]">Original</p>
              </div>
              <div className="rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-4 text-center">
                <p className="text-lg font-bold text-blue-500">
                  {formatBytes(compressedSize)}
                </p>
                <p className="mt-1 text-xs text-[#8b8fa3]">Compressed</p>
              </div>
              <div className="rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-4 text-center">
                <p className="text-lg font-bold text-green-400">{savings}%</p>
                <p className="mt-1 text-xs text-[#8b8fa3]">Saved</p>
              </div>
            </div>

            {/* Preview */}
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-medium text-[#8b8fa3]">
                  Original
                </p>
                <div className="overflow-hidden rounded-lg border border-[#2a2e3a] bg-[#1a1d27]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={originalUrl}
                    alt="Original"
                    className="w-full object-contain"
                    style={{ maxHeight: 400 }}
                  />
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-[#8b8fa3]">
                  Compressed
                </p>
                <div className="overflow-hidden rounded-lg border border-[#2a2e3a] bg-[#1a1d27]">
                  {compressedUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={compressedUrl}
                      alt="Compressed"
                      className="w-full object-contain"
                      style={{ maxHeight: 400 }}
                    />
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
