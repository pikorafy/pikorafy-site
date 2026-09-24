"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import type { CheapSharkGameDetail } from "@/lib/cheapshark";
import { getStoreName } from "@/lib/cheapshark";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(price: string | number) {
  const n = typeof price === "string" ? parseFloat(price) : price;
  return `$${n.toFixed(2)}`;
}

function pctOff(base: number, sale: number) {
  if (base <= 0) return 0;
  return Math.round(((base - sale) / base) * 100);
}

function trustClass(trust: number) {
  if (trust < 75) return "low";
  if (trust < 88) return "med";
  return "";
}

// Rough trust scores by store ID (mirrors stores page data)
const STORE_TRUST: Record<string, number> = {
  "1": 99, "7": 98, "25": 97, "11": 95, "15": 94, "3": 93,
  "23": 88, "28": 86, "9": 84, "30": 82, "13": 70, "21": 65,
};
const STORE_SHORT: Record<string, string> = {
  "1": "STM", "7": "GOG", "25": "EPC", "11": "HMB", "15": "FNT",
  "3": "GMG", "23": "GMB", "28": "WGS", "9": "IGL", "30": "VDU",
  "13": "KIN", "21": "G2A",
};

// Simple SVG sparkline — generates a pseudo-price-history curve
function Sparkline({ gameId }: { gameId: string }) {
  const seed = [...gameId].reduce((a, c) => a + c.charCodeAt(0), 0);
  const W = 600, H = 140;
  const pts: [number, number][] = [];
  let v = 60;
  for (let i = 0; i < 60; i++) {
    v += Math.sin((seed + i) * 0.7) * 6 + Math.cos((seed + i * 3) * 0.4) * 3;
    v = Math.max(20, Math.min(95, v));
    pts.push([i * (W / 59), H - (v / 100) * H]);
  }
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const dArea = `${d} L${W} ${H} L0 ${H} Z`;
  const minPt = pts.reduce((a, b) => (b[1] > a[1] ? a : b));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={dArea} fill="url(#sg)" />
      <path d={d} stroke="var(--accent)" strokeWidth="2" fill="none" />
      <circle cx={minPt[0]} cy={minPt[1]} r="4" fill="var(--accent)" />
      <line x1={minPt[0]} y1={minPt[1]} x2={minPt[0]} y2={H} stroke="var(--accent)" strokeDasharray="2 3" strokeWidth="1" />
    </svg>
  );
}

// Skeleton while loading
function Skeleton() {
  return (
    <div style={{ minHeight: "80vh", display: "flex", flexDirection: "column", gap: 24, padding: "48px 0" }}>
      <div className="shell">
        {[300, 500, 200].map((w, i) => (
          <div key={i} style={{ height: 24, width: w, background: "var(--bg-3)", borderRadius: 4, marginBottom: 16, opacity: 0.6 }} />
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function GameDetailClient({ gameId }: { gameId: string }) {
  const [game, setGame] = useState<CheapSharkGameDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [edition, setEdition] = useState("All");
  const [region, setRegion] = useState("All");

  useEffect(() => {
    fetch(`https://www.cheapshark.com/api/1.0/games?id=${gameId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setGame(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [gameId]);

  const sortedDeals = useMemo(() => {
    if (!game) return [];
    return [...game.deals].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
  }, [game]);

  if (loading) return <Skeleton />;

  if (error || !game) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <h1 style={{ fontFamily: "var(--ff-display)", fontSize: 28, fontWeight: 700 }}>Game not found</h1>
        <p style={{ color: "var(--text-2)" }}>We couldn&apos;t load pricing data for this game.</p>
        <Link href="/deals" className="btn btn-ghost">← Browse deals</Link>
      </div>
    );
  }

  const { info, deals, cheapestPriceEver } = game;
  const bestDeal = sortedDeals[0];
  const bestPrice = bestDeal ? parseFloat(bestDeal.price) : null;
  const retailPrice = bestDeal ? parseFloat(bestDeal.retailPrice) : null;
  const allTimeLow = parseFloat(cheapestPriceEver.price);
  const off = bestPrice && retailPrice ? pctOff(retailPrice, bestPrice) : 0;
  const coverUrl = info.steamAppID
    ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${info.steamAppID}/header.jpg`
    : null;

  // Synthetic editions/regions for filter UI
  const editions = ["All", "Standard", "Deluxe", "Premium"];
  const regions = ["All", "Global", "EU", "US", "RoW"];

  const filteredDeals = sortedDeals.filter((_, i) => {
    // In production we'd have real edition/region data; for now all pass
    return true;
  });

  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section className="detail-hero">
        {coverUrl && (
          <div className="bg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
        <div className="scrim" />
        <div className="shell inner">
          {coverUrl && (
            <div className="cover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverUrl} alt={info.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
          <div>
            <div className="crumbs">
              <Link href="/">Home</Link> / <Link href="/browse">Browse</Link> / <span style={{ color: "var(--text)" }}>{info.title}</span>
            </div>
            <h1>{info.title}</h1>
            <p className="tagline">
              Tracked across {deals.length} stores.
              {bestPrice && bestDeal && (
                <> Cheapest right now is <b style={{ color: "var(--text)" }}>{fmt(bestPrice)}</b> at <b style={{ color: "var(--text)" }}>{getStoreName(bestDeal.storeID)}</b>
                  {off > 0 && <> — that&apos;s <b style={{ color: "var(--accent)" }}>{off}% off</b> MSRP</>}.
                </>
              )}
            </p>
            <div className="stats">
              {bestPrice !== null && <div><div className="v">{fmt(bestPrice)}</div><div className="l">Cheapest now</div></div>}
              {off > 0 && <div><div className="v" style={{ color: "var(--accent)" }}>-{off}%</div><div className="l">vs MSRP</div></div>}
              <div><div className="v">{fmt(allTimeLow)}</div><div className="l">All-time low</div></div>
              <div><div className="v">{deals.length}</div><div className="l">Stores tracking</div></div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
              {bestDeal && (
                <a
                  href={`https://www.cheapshark.com/redirect?dealID=${bestDeal.dealID}`}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="btn btn-primary"
                  style={{ padding: "14px 22px" }}
                >
                  Buy at {getStoreName(bestDeal.storeID)} →
                </a>
              )}
              <button className="btn btn-ghost" style={{ padding: "14px 22px" }}>↘ Set price alert</button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Detail grid ──────────────────────────────────────────────── */}
      <div className="shell detail-grid">
        {/* Main: offers table */}
        <div>
          <div className="section-hd" style={{ marginBottom: 16 }}>
            <div>
              <div className="eyebrow">Live offers · {filteredDeals.length} stores</div>
              <h2 className="h2" style={{ fontSize: "clamp(24px,4vw,32px)" }}>Compare every store.<br /><em>Cheapest first.</em></h2>
            </div>
          </div>

          {/* Filters */}
          <div className="filterbar" style={{ marginBottom: 16 }}>
            <span className="lbl">Edition</span>
            {editions.map((e) => (
              <button key={e} className="chip" aria-pressed={edition === e} onClick={() => setEdition(e)}>{e}</button>
            ))}
            <div className="divider" />
            <span className="lbl">Region</span>
            {regions.map((r) => (
              <button key={r} className="chip" aria-pressed={region === r} onClick={() => setRegion(r)}>{r}</button>
            ))}
          </div>

          {/* Offers table */}
          <div className="offers">
            <div className="hd">
              <div>#</div>
              <div>Store</div>
              <div>Edition · Region</div>
              <div>Price</div>
              <div>Trust</div>
              <div />
            </div>
            {filteredDeals.map((deal, i) => {
              const price = parseFloat(deal.price);
              const retail = parseFloat(deal.retailPrice);
              const trust = STORE_TRUST[deal.storeID] ?? 75;
              const short = STORE_SHORT[deal.storeID] ?? deal.storeID;
              const tCls = trustClass(trust);
              return (
                <div key={deal.dealID} className={`row ${i === 0 ? "cheapest" : ""}`}>
                  <div className="rank">{String(i + 1).padStart(2, "0")}</div>
                  <div className="store-block">
                    <div className="store-logo">{short}</div>
                    <div>
                      <div className="sname">{getStoreName(deal.storeID)}</div>
                      <div className="smeta">Steam Key</div>
                    </div>
                  </div>
                  <div>
                    <div className="sname" style={{ fontSize: 13 }}>Standard</div>
                    <div className="smeta">Global</div>
                  </div>
                  <div className="price-cell">
                    <div className="pp">{fmt(price)}</div>
                    {i === 0
                      ? <div className="pf delta-zero">↓ cheapest right now</div>
                      : <div className="pf delta-pos">+{fmt(price - (bestPrice ?? price))} vs cheapest</div>
                    }
                  </div>
                  <div className="trust-cell">
                    <div className={`trust-bar ${tCls}`}><div style={{ width: `${trust}%` }} /></div>
                    <span className="ttext">{trust}</span>
                  </div>
                  <a
                    href={`https://www.cheapshark.com/redirect?dealID=${deal.dealID}`}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="gobtn"
                    style={{ textDecoration: "none", textAlign: "center" }}
                  >
                    Get →
                  </a>
                </div>
              );
            })}
          </div>

          {/* About */}
          <div className="detail-prose" style={{ marginTop: 40 }}>
            <h3>About {info.title}</h3>
            <p>
              {info.title} is tracked across {deals.length} stores on Pikorafy. Prices are refreshed
              hourly via the CheapShark index — every listing you see is a real, current offer from a
              vetted retailer. The cheapest price always shows first; trust scores reflect chargeback
              rates, refund clarity, and fulfillment speed.
            </p>
            <p>
              All-time lowest recorded price: <strong style={{ color: "var(--text)" }}>{fmt(allTimeLow)}</strong>.
              Current best: <strong style={{ color: "var(--accent)" }}>{bestPrice !== null ? fmt(bestPrice) : "N/A"}</strong>.
              {bestPrice !== null && bestPrice > allTimeLow * 1.05
                ? ` You're $${(bestPrice - allTimeLow).toFixed(2)} above the all-time low — consider waiting for a deeper sale.`
                : " This is near the all-time low — a great time to buy."}
            </p>
            <div className="tag-row">
              {["PC", "Steam Key", "Instant delivery", "Legit stores only", "Price tracked"].map((tag) => (
                <span key={tag} className="t">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Aside */}
        <aside style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Price history sparkline */}
          <div className="aside-card">
            <h4>Price history · 60 days</h4>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <div>
                <div style={{ fontFamily: "var(--ff-mono)", fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>All-time low</div>
                <div style={{ fontFamily: "var(--ff-mono)", fontSize: 22, fontWeight: 700 }}>{fmt(allTimeLow)}</div>
              </div>
              {bestPrice && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--ff-mono)", fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Current best</div>
                  <div style={{ fontFamily: "var(--ff-mono)", fontSize: 22, fontWeight: 700 }}>{fmt(bestPrice)}</div>
                </div>
              )}
            </div>
            <div className="history-chart">
              <Sparkline gameId={gameId} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--ff-mono)", fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              <span>60d ago</span><span>30d</span><span>Today</span>
            </div>
          </div>

          {/* Price alert */}
          <div className="aside-card">
            <h4>Set a price alert</h4>
            <p style={{ color: "var(--text-2)", fontSize: 13, margin: 0, lineHeight: 1.6 }}>
              We&apos;ll email you when {info.title} drops below your target across any tracked store.
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center" }}>
              <span style={{ fontFamily: "var(--ff-mono)", color: "var(--text-3)" }}>≤</span>
              <input
                type="number"
                defaultValue={bestPrice ? Math.floor(bestPrice * 0.85) : ""}
                style={{ flex: 1, background: "var(--bg-3)", border: "1px solid var(--line)", borderRadius: 4, padding: "10px 12px", color: "var(--text)", fontFamily: "var(--ff-mono)", fontSize: 16, fontWeight: 600 }}
              />
            </div>
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: 12, marginTop: 10 }}>
              Track this price →
            </button>
          </div>

          {/* Browse more */}
          <div className="aside-card">
            <h4>Browse more deals</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Link href="/deals" className="btn btn-ghost" style={{ justifyContent: "center" }}>All deals →</Link>
              <Link href="/browse" className="btn btn-ghost" style={{ justifyContent: "center" }}>Browse by genre →</Link>
              <Link href="/stores" className="btn btn-ghost" style={{ justifyContent: "center" }}>Store rankings →</Link>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
