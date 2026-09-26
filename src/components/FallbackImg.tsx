"use client";

import { useState } from "react";

// An <img> that works down a list of candidate URLs, moving on when one fails to load
// (e.g. guessed Nintendo art that doesn't exist). The optional `last` image is shown
// fitted rather than cropped (square art in a wide frame).
export default function FallbackImg({
  srcs,
  last,
  alt,
  style,
  loading,
  width,
  height,
}: {
  srcs: string[];
  last?: string | null;
  alt: string;
  style?: React.CSSProperties;
  loading?: "lazy" | "eager";
  width?: number;
  height?: number;
}) {
  const chain = [...srcs, ...(last ? [last] : [])];
  const [i, setI] = useState(0);
  const src = chain[i];
  if (!src) return <div style={{ ...style, background: "var(--bg-3)" }} />;
  const isLast = !!last && i === chain.length - 1;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={src}
      src={src}
      alt={alt}
      loading={loading}
      width={width}
      height={height}
      onError={() => setI((n) => n + 1)}
      style={{ ...style, ...(isLast ? { objectFit: "contain", background: "var(--bg-3)" } : {}) }}
    />
  );
}
