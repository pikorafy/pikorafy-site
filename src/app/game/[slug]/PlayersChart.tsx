import type { PlayerPoint } from "@/lib/catalog";

// Line chart of daily peak players. Server-rendered SVG, no client JS.
export default function PlayersChart({ points }: { points: PlayerPoint[] }) {
  const W = 600, H = 120, PAD = 8;
  const max = Math.max(...points.map((p) => p.peak)) || 1;
  const x = (i: number) => (i / (points.length - 1)) * W;
  const y = (v: number) => PAD + (1 - v / max) * (H - PAD * 2);

  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(p.peak).toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Daily peak players, last 30 days">
      <defs>
        <linearGradient id="pl-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--accent-2)" stopOpacity="0.3" />
          <stop offset="1" stopColor="var(--accent-2)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${W} ${H} L0 ${H} Z`} fill="url(#pl-fill)" />
      <path d={d} stroke="var(--accent-2)" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
