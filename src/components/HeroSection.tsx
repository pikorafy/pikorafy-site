"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const TRENDING = [
  { title: "Elden Ring", genre: "RPG · PC / PS5 / XBX", price: "$19.99" },
  { title: "Baldur's Gate 3", genre: "RPG · PC / PS5", price: "$29.99" },
  { title: "Cyberpunk 2077", genre: "Action · PC / PS5 / XBX", price: "$14.99" },
  { title: "Hogwarts Legacy", genre: "Adventure · PC / PS5", price: "$24.99" },
  { title: "The Witcher 3", genre: "RPG · PC / PS5 / XBX", price: "$7.49" },
  { title: "Red Dead Redemption 2", genre: "Action · PC", price: "$17.99" },
];

const STATS = [
  { num: "11,482", lbl: "Games tracked" },
  { num: "47", lbl: "Stores indexed" },
  { num: "$1.4M", lbl: "Saved this month" },
  { num: "14s", lbl: "Refresh interval" },
];

export default function HeroSection() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const matches = query.trim()
    ? TRENDING.filter((g) => g.title.toLowerCase().includes(query.toLowerCase()))
    : TRENDING.slice(0, 4);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/deals?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <section className="hero shell">
      <div className="hero-grid">
        {/* Left */}
        <div className="hero-l">
          <div className="hero-tag">
            <span className="pulse" />
            LIVE INDEX · 11,482 GAMES · 47 STORES · UPDATED 14s AGO
          </div>

          <h1>
            Game keys.<br />
            Tracked. <span className="accent">Cheapest first.</span>
          </h1>

          <p className="lede">
            Pikorafy compares prices across every legit game store on the planet — Steam, GOG,
            Epic, and 40+ vetted resellers — so you never pay full MSRP again.
          </p>

          {/* Search */}
          <form onSubmit={handleSubmit}>
            <div className="searchbar" ref={wrapRef}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4-4" />
              </svg>
              <input
                placeholder='Search 11,482 games — try "Elden Ring" or "rpg under $10"'
                value={query}
                onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
              />
              <span className="search-hint">⌘ K</span>

              {open && (
                <div className="search-dropdown">
                  <div className="sd-section">{query ? "matches" : "trending now"}</div>
                  {matches.map((g) => (
                    <a
                      key={g.title}
                      className="sd-row"
                      href={`/deals?q=${encodeURIComponent(g.title)}`}
                      onClick={() => setOpen(false)}
                    >
                      <div>
                        <div className="ttl">{g.title}</div>
                        <div className="meta">{g.genre}</div>
                      </div>
                      <div className="price">{g.price}</div>
                    </a>
                  ))}
                  {!query && (
                    <>
                      <div className="sd-section" style={{ marginTop: 4 }}>jump to</div>
                      <a
                        className="sd-row"
                        href="/deals?sort=savings"
                        onClick={() => setOpen(false)}
                        style={{ gridTemplateColumns: "1fr auto" }}
                      >
                        <div>
                          <span style={{ fontFamily: "var(--ff-mono)", fontSize: 12, fontWeight: 600 }}>biggest-discounts</span>
                          {" "}<span className="meta">— all deals sorted by savings</span>
                        </div>
                        <div className="meta">→</div>
                      </a>
                    </>
                  )}
                </div>
              )}
            </div>
          </form>

          {/* Stats */}
          <div className="hero-stats">
            {STATS.map((s) => (
              <div key={s.lbl}>
                <span className="num">{s.num}</span>
                <span className="lbl">{s.lbl}</span>
              </div>
            ))}
          </div>
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
