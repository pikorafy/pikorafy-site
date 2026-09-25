// Hero price tiles (two, side by side) and the ratings/players row (three equal columns).

export function PriceTiles({ children }: { children: React.ReactNode }) {
  return <div className="price-tiles">{children}</div>;
}

/** A large coloured price tile; `badge` (e.g. "-35%") sits beside the price. No `tone` = neutral. */
export function PriceTile({ label, value, tone, badge }: { label: string; value: string; tone?: string; badge?: string }) {
  return (
    <div className={`price-tile${tone ? "" : " neutral"}`} style={tone ? { background: tone } : undefined}>
      <div className="pt-label">{label}</div>
      <div className="pt-row">
        <span className="pt-value">{value}</span>
        {badge && <span className="pt-badge">{badge}</span>}
      </div>
    </div>
  );
}

export function MetaStats({ children }: { children: React.ReactNode }) {
  return <div className="meta-stats">{children}</div>;
}

export function MetaStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="meta-stat">
      <div className="v">{value}</div>
      <div className="l">{label}</div>
    </div>
  );
}
