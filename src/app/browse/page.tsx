"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { CheapSharkDeal } from "@/lib/cheapshark";
import { getStoreName, getSteamCoverUrl } from "@/lib/cheapshark";

// ─── Types & helpers ─────────────────────────────────────────────────────────

type SortKey = "discount" | "price" | "rating" | "new";
type ViewKey = "boxart" | "list";

const GENRES = ["Action", "Adventure", "RPG", "Strategy", "Indie", "Shooter", "Racing", "Sports", "Simulation", "Puzzle"];
const PLATFORMS = [{ k: "PC", label: "Windows PC" }, { k: "PS", label: "PlayStation" }, { k: "XBOX", label: "Xbox" }, { k: "SWITCH", label: "Nintendo Switch" }];
const STATUS_OPTS = [
  { k: "onSale", label: "On sale" },
  { k: "topRated", label: "Top rated (80+)" },
  { k: "recent", label: "Recent releases" },
];

function pctOff(normal: string, sale: string) {
  const n = parseFloat(normal);
  const s = parseFloat(sale);
  if (n <= 0) return 0;
  return Math.round(((n - s) / n) * 100);
}

function getDealBadge(savings: number) {
  if (savings >= 80) return { label: "INSANE", color: "var(--punch)" };
  if (savings >= 60) return { label: "HOT", color: "#f97316" };
  if (savings >= 40) return { label: "GREAT", color: "var(--good)" };
  return { label: "GOOD", color: "var(--accent-2)" };
}

// ─── Card components ──────────────────────────────────────────────────────────

function BoxartCard({ deal }: { deal: CheapSharkDeal }) {
  const savings = parseFloat(deal.savings);
  const badge = getDealBadge(savings);
  const cover = getSteamCoverUrl(deal.steamAppID);
  const mc = parseInt(deal.metacriticScore);

  return (
    <Link href={`/game/${deal.gameID}`} className="card boxart" style={{ textDecoration: "none", color: "inherit" }}>
      <div className="cover">
        {cover
          ? <Image src={cover} alt={deal.title} fill sizes="260px" unoptimized style={{ objectFit: "cover" }} />
          : <div style={{ background: "var(--bg-3)", width: "100%", height: "100%" }} />
        }
        {savings > 0 && (
          <div className="disc-tag">-{savings.toFixed(0)}%</div>
        )}
      </div>
      <div className="body">
        <div className="meta">
          <span>{getStoreName(deal.storeID)}</span>
          {mc > 0 && <span style={{ color: mc >= 75 ? "var(--good)" : mc >= 50 ? "var(--warn)" : "var(--punch)" }}>MC {mc}</span>}
          <span style={{ background: badge.color, color: "#000", padding: "1px 5px", borderRadius: 2, fontSize: 9, fontWeight: 700 }}>{badge.label}</span>
        </div>
        <div className="title">{deal.title}</div>
        <div className="prices" style={{ marginTop: "auto", paddingTop: 8, borderTop: "1px solid var(--line)" }}>
          <div>
            <div className="was">${deal.normalPrice}</div>
            <div className="now">${deal.salePrice}</div>
          </div>
          <div style={{ fontFamily: "var(--ff-mono)", fontSize: 10, color: "var(--text-3)", alignSelf: "flex-end" }}>
            {deal.storeID && <span className="stores"><b>{getStoreName(deal.storeID)}</b></span>}
          </div>
        </div>
      </div>
    </Link>
  );
}

function ListRow({ deal, idx }: { deal: CheapSharkDeal; idx: number }) {
  const savings = parseFloat(deal.savings);
  const cover = getSteamCoverUrl(deal.steamAppID);
  return (
    <Link href={`/game/${deal.gameID}`} className={`lr ${idx === 0 ? "top1" : ""}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div className="rank">{String(idx + 1).padStart(2, "0")}</div>
      <div className="lcover">
        {cover
          ? <Image src={cover} alt={deal.title} fill sizes="50px" unoptimized style={{ objectFit: "cover" }} />
          : <div style={{ background: "var(--bg-3)", width: "100%", height: "100%" }} />
        }
      </div>
      <div className="ltitle"><b>{deal.title}</b><span>{getStoreName(deal.storeID)}</span></div>
      <div className="lprice">${deal.salePrice}</div>
      <div className="lwas">${deal.normalPrice}</div>
      <div className="ldisc">-{savings.toFixed(0)}%</div>
      <div className="lstores">{deal.storeID}</div>
      <div className="lcta">Get deal</div>
    </Link>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BrowsePage() {
  const [deals, setDeals] = useState<CheapSharkDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [maxPrice, setMaxPrice] = useState(80);
  const [sort, setSort] = useState<SortKey>("discount");
  const [view, setView] = useState<ViewKey>("boxart");
  const [statuses, setStatuses] = useState<string[]>([]);

  useEffect(() => {
    fetch("https://www.cheapshark.com/api/1.0/deals?sortBy=Deal+Rating&pageSize=60&onSale=1&metacritic=0")
      .then((r) => (r.ok ? r.json() : []))
      .then(setDeals)
      .catch(() => setDeals([]))
      .finally(() => setLoading(false));
  }, []);

  const toggleStatus = (k: string) =>
    setStatuses((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));

  const results = useMemo(() => {
    let g = [...deals];
    const ql = q.toLowerCase().trim();
    if (ql) g = g.filter((d) => d.title.toLowerCase().includes(ql));
    g = g.filter((d) => parseFloat(d.salePrice) <= maxPrice);
    if (statuses.includes("onSale")) g = g.filter((d) => parseFloat(d.savings) > 0);
    if (statuses.includes("topRated")) g = g.filter((d) => parseInt(d.metacriticScore) >= 80);
    if (sort === "discount") g.sort((a, b) => parseFloat(b.savings) - parseFloat(a.savings));
    if (sort === "price") g.sort((a, b) => parseFloat(a.salePrice) - parseFloat(b.salePrice));
    if (sort === "rating") g.sort((a, b) => parseInt(b.metacriticScore) - parseInt(a.metacriticScore));
    return g;
  }, [deals, q, maxPrice, statuses, sort]);

  return (
    <>
      {/* Search bar */}
      <section className="shell" style={{ paddingTop: 32 }}>
        <div className="searchbar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" /><path d="m21 21-4-4" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search game deals…"
          />
          <span className="search-hint">⌘ K</span>
        </div>
        <div className="results-hd">
          <h2>
            {q ? <>Results for <span className="qy">&ldquo;{q}&rdquo;</span></> : "Browse all deals"}
          </h2>
          <div className="ct">
            {loading ? "Loading…" : `${results.length} games · 30+ stores · live`}
          </div>
        </div>
      </section>

      {/* Results shell */}
      <section className="shell results-shell">
        {/* Sidebar */}
        <aside>
          <div className="facet">
            <h5>Status</h5>
            {STATUS_OPTS.map(({ k, label }) => (
              <label key={k}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={statuses.includes(k)} onChange={() => toggleStatus(k)} />
                  {label}
                </span>
              </label>
            ))}
          </div>
          <div className="facet">
            <h5>Max price</h5>
            <div className="range-input">
              <span>≤ $</span>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value) || 0)}
                min={0}
                max={80}
              />
            </div>
            <input
              type="range"
              min={0}
              max={80}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="range-input"
              style={{ width: "100%", marginTop: 14 }}
            />
          </div>
          <div className="facet">
            <h5>Quick links</h5>
            {[["Best deals today", "/deals"], ["Store trust rankings", "/stores"], ["Price comparisons", "/vs"]].map(([label, href]) => (
              <Link key={href} href={href} style={{ display: "block", padding: "5px 0", fontSize: 13, color: "var(--text-2)" }}>{label} →</Link>
            ))}
          </div>
        </aside>

        {/* Results */}
        <div>
          <div className="filterbar" style={{ marginBottom: 16 }}>
            <span className="lbl">Sort</span>
            {([["discount", "Biggest discount"], ["price", "Lowest price"], ["rating", "Highest rated"]] as [SortKey, string][]).map(([k, l]) => (
              <button key={k} className="chip" aria-pressed={sort === k} onClick={() => setSort(k)}>{l}</button>
            ))}
            <div className="grow" />
            <span className="lbl">View</span>
            {([["boxart", "Cards"], ["list", "Rows"]] as [ViewKey, string][]).map(([k, l]) => (
              <button key={k} className="chip" aria-pressed={view === k} onClick={() => setView(k)}>{l}</button>
            ))}
          </div>

          {loading ? (
            <div className="cards">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} style={{ background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: "var(--r)", aspectRatio: "16/9", opacity: 0.5 }} className="animate-pulse" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: "80px 20px", textAlign: "center", border: "1px dashed var(--line-2)", borderRadius: "var(--r)" }}>
              <div style={{ fontFamily: "var(--ff-mono)", fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>0 results</div>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 22, fontWeight: 600 }}>Nothing matches those filters.</div>
              <div style={{ color: "var(--text-2)", marginTop: 6 }}>Try raising the price ceiling or clearing filters.</div>
            </div>
          ) : view === "list" ? (
            <div className="list-rows">
              <div className="lh">
                <div>#</div><div /><div>Title</div>
                <div style={{ textAlign: "right" }}>Now</div>
                <div style={{ textAlign: "right" }}>Was</div>
                <div style={{ textAlign: "right" }}>Off</div>
                <div style={{ textAlign: "right" }}>Store</div>
                <div style={{ textAlign: "right" }}>Action</div>
              </div>
              {results.map((d, i) => <ListRow key={d.dealID} deal={d} idx={i} />)}
            </div>
          ) : (
            <div className="cards">
              {results.map((d) => <BoxartCard key={d.dealID} deal={d} />)}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
