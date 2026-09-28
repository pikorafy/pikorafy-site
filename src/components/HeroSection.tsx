import type { SiteStats } from "@/lib/catalog";

const count = (n: number) => n.toLocaleString("en");

export default function HeroSection({ stats }: { stats: SiteStats | null }) {
  // Real numbers from the catalog (site_stats); hidden if the database didn't answer.
  const statRow = stats
    ? [
        { num: count(stats.games), lbl: "Games tracked" },
        { num: count(stats.stores), lbl: "Stores compared" },
        { num: count(stats.onSale), lbl: "On sale now" },
        { num: "Hourly", lbl: "Price refresh" },
      ]
    : [];

  return (
    <section className="hero shell">
      <div className="hero-grid">
        {/* Left */}
        <div className="hero-l">
          <div className="hero-tag">
            <span className="pulse" />
            {stats
              ? `LIVE INDEX · ${count(stats.games)} GAMES · STEAM · XBOX · NINTENDO`
              : "LIVE INDEX · STEAM · XBOX · NINTENDO"}
          </div>

          <h1>
            Game keys.<br />
            Tracked. <span className="accent">Cheapest first.</span>
          </h1>

          <p className="lede">
            Pikorafy compares game prices across {stats ? `${stats.stores} stores` : "official stores and key shops"} —
            Steam, GOG, Humble, the Xbox Store, the Nintendo eShop and more — so you never pay full price again.
          </p>

          {/* Stats */}
          {statRow.length > 0 && <div className="hero-stats">
            {statRow.map((s) => (
              <div key={s.lbl}>
                <span className="num">{s.num}</span>
                <span className="lbl">{s.lbl}</span>
              </div>
            ))}
          </div>}
        </div>

        {/* Right — Featured partner card */}
        <aside className="hero-r">
          <div
            className="feat-cover"
            style={{
              background: "linear-gradient(135deg, #0c1623 0%, #1a0a2e 40%, #0a1a1f 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div className="badge">PARTNER SPOTLIGHT</div>
            {/* Decorative SVG background */}
            <svg
              viewBox="0 0 320 280"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.7 }}
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <pattern id="ig-p" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(38)">
                  <rect width="18" height="18" fill="oklch(0.18 0.08 260)" />
                  <rect width="8" height="18" fill="oklch(0.28 0.12 260)" />
                </pattern>
                <linearGradient id="ig-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#0c1623" stopOpacity="0" />
                  <stop offset="1" stopColor="#0c1623" stopOpacity="0.85" />
                </linearGradient>
              </defs>
              <rect width="320" height="280" fill="url(#ig-p)" />
              <rect width="320" height="280" fill="url(#ig-grad)" />
              <text x="20" y="80" fontFamily="Space Grotesk, sans-serif" fontSize="52" fontWeight="700" fill="rgba(230,57,70,0.18)" letterSpacing="-2">INSTANT</text>
              <text x="20" y="136" fontFamily="Space Grotesk, sans-serif" fontSize="52" fontWeight="700" fill="rgba(230,57,70,0.12)" letterSpacing="-2">GAMING</text>
            </svg>
            {/* Logo area */}
            <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
              <div style={{
                fontFamily: "var(--ff-mono)",
                fontSize: 11,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "var(--text-3)",
                marginBottom: 10,
              }}>
                Verified partner
              </div>
              <div style={{
                fontFamily: "var(--ff-display)",
                fontSize: 34,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "var(--honey)",
                lineHeight: 1,
              }}>
                Instant<br />
                <span style={{ color: "var(--punch)" }}>Gaming</span>
              </div>
              <div style={{
                marginTop: 14,
                fontFamily: "var(--ff-mono)",
                fontSize: 11,
                color: "var(--text-3)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}>
                400,000+ keys · 40+ countries
              </div>
            </div>
          </div>

          <div className="feat-body">
            <div className="feat-title">Up to 80% off PC keys</div>
            <div className="feat-meta">
              <span>Steam Keys</span>
              <span>GOG Keys</span>
              <span>DRM-Free</span>
            </div>
            <div className="feat-prices">
              <div>
                <div className="feat-was">Retail: $59.99</div>
                <div className="feat-now">from $5.99</div>
              </div>
              <div className="feat-disc">-90%</div>
            </div>
            <a
              href="https://www.instant-gaming.com/?igr=pikorafy"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "12px" }}
            >
              Browse all deals →
            </a>
          </div>
        </aside>
      </div>
    </section>
  );
}
