import type { PricePoint } from "@/lib/catalog";

// Step chart of the daily lowest price. Server-rendered SVG, no client JS.
export default function PriceChart({ points }: { points: PricePoint[] }) {
  const W = 600, H = 140, PAD = 8;
  const prices = points.map((p) => p.price);
  const max = Math.max(...prices);
  const min = Math.min(...prices);
  const span = max - min || 1;
  const t0 = Date.parse(points[0].day);
  const t1 = Date.parse(points[points.length - 1].day);
  const tSpan = t1 - t0 || 1;

  const x = (day: string) => ((Date.parse(day) - t0) / tSpan) * W;
  const y = (price: number) => PAD + (1 - (price - min) / span) * (H - PAD * 2);

  let d = `M0 ${y(points[0].price).toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    d += ` H${x(points[i].day).toFixed(1)} V${y(points[i].price).toFixed(1)}`;
  }
  d += ` H${W}`;
  const low = points.reduce((a, b) => (b.price < a.price ? b : a));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Price history">
      <defs>
        <linearGradient id="ph-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.3" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} V${H} H0 Z`} fill="url(#ph-fill)" />
      <path d={d} stroke="var(--accent)" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
      <circle cx={x(low.day)} cy={y(low.price)} r="4" fill="var(--accent)" />
    </svg>
  );
}
