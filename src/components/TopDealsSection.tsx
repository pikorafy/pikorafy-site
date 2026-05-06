"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import type { CheapSharkDeal } from "@/lib/cheapshark";
import { getSteamCoverUrl, getDealUrl, getStoreName } from "@/lib/cheapshark";
import Link from "next/link";

type SortMode = "discount" | "price" | "rating";
type CardVariant = "boxart" | "data" | "list";

const GENRES = ["All", "RPG", "Action", "Adventure", "Shooter", "Strategy", "Indie", "Puzzle"];
const PLATFORMS = ["All", "PC", "PS5", "XBX", "SW"];

function sortDeals(deals: CheapSharkDeal[], mode: SortMode): CheapSharkDeal[] {
  return [...deals].sort((a, b) => {
    if (mode === "discount") return parseFloat(b.savings) - parseFloat(a.savings);
    if (mode === "price") return parseFloat(a.salePrice) - parseFloat(b.salePrice);
    return parseFloat(b.dealRating) - parseFloat(a.dealRating);
  });
}

export default function TopDealsSection() {
  const [allDeals, setAllDeals] = useState<CheapSharkDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [genre, setGenre] = useState("All");
  const [platform, setPlatform] = useState("All");
  const [maxPrice, setMaxPrice] = useState(60);
  const [sortMode, setSortMode] = useState<SortMode>("discount");
  const [variant, setVariant] = useState<CardVariant>("boxart");

  useEffect(() => {
    fetch("https://www.cheapshark.com/api/1.0/deals?sortBy=Deal+Rating&pageSize=60&onSale=1&metacritic=50")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: CheapSharkDeal[]) => setAllDeals(data))
      .catch(() => setAllDeals([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = sortDeals(
    allDeals.filter((d) => parseFloat(d.salePrice) <= maxPrice),
    sortMode
  ).slice(0, variant === "list" ? 20 : 12);

  return (
    <section className="section" id="deals">
      <div className="shell">
        <div className="section-hd">
          <div>
            <div className="eyebrow">Top deals · biggest discounts</div>
            <h2 className="h2">
              The <em>cheapest</em> moves<br />this hour.
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: "var(--ff-mono)", fontSize: 11, color: "var(--text-3)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Live · CheapShark
            </span>
            <Link href="/deals" className="btn btn-ghost">All deals →</Link>
          </div>
        </div>

        {/* Filter bar */}
        <div className="filterbar">
          <span className="lbl">Genre</span>
          {GENRES.map((g) => (
            <button
              key={g}
              className="chip"
              aria-pressed={genre === g}
              onClick={() => setGenre(g)}
            >
              {g}
            </button>
          ))}

          <div className="divider" />

          <span className="lbl">Platform</span>
          {PLATFORMS.map((p) => (
            <button
              key={p}
              className="chip"
              aria-pressed={platform === p}
              onClick={() => setPlatform(p)}
            >
              {p}
            </button>
          ))}

          <div className="divider" />

          <span className="lbl">Max ${maxPrice}</span>
          <input
            type="range"
            min={1}
            max={80}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="range-input"
            style={{ width: 100 }}
          />

          <div className="grow" />

          <span className="lbl">Sort</span>
          {(["discount", "price", "rating"] as SortMode[]).map((s) => (
            <button
              key={s}
              className="chip"
              aria-pressed={sortMode === s}
              onClick={() => setSortMode(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}

          <div className="divider" />

          {(["boxart", "data", "list"] as CardVariant[]).map((v) => (
            <button
              key={v}
              className="chip"
              aria-pressed={variant === v}
              onClick={() => setVariant(v)}
              title={`${v} view`}
            >
              {v === "boxart" ? "⊞" : v === "data" ? "≡" : "▤"}
            </button>
          ))}
        </div>

        {/* Cards */}
        {loading ? (
          <div className="cards">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card boxart" style={{ opacity: 0.4 }}>
                <div className="cover" style={{ background: "var(--bg-3)", aspectRatio: "16/9" }} />
                <div className="body" style={{ gap: 8 }}>
                  <div style={{ height: 14, background: "var(--bg-3)", borderRadius: 3, width: "70%" }} />
                  <div style={{ height: 22, background: "var(--bg-3)", borderRadius: 3, width: "40%", marginTop: "auto" }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-3)", fontFamily: "var(--ff-mono)", fontSize: 12 }}>
            No deals match those filters.
          </div>
        ) : variant === "boxart" ? (
          <BoxartGrid deals={filtered} />
        ) : variant === "data" ? (
          <DataList deals={filtered} />
        ) : (
          <ListRows deals={filtered} />
        )}
      </div>
    </section>
  );
}

function BoxartGrid({ deals }: { deals: CheapSharkDeal[] }) {
  return (
    <div className="cards">
      {deals.map((deal) => {
        const cover = getSteamCoverUrl(deal.steamAppID);
        const disc = Math.round(parseFloat(deal.savings));
        return (
          <a
            key={deal.dealID}
            href={getDealUrl(deal.dealID)}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="card boxart"
          >
            <div className="cover">
              {cover ? (
                <Image src={cover} alt={deal.title} fill style={{ objectFit: "cover" }} sizes="(max-width: 640px) 50vw, 25vw" unoptimized />
              ) : (
                <div style={{ background: `hsl(${(parseInt(deal.gameID, 10) * 37) % 360},38%,22%)`, width: "100%", height: "100%" }} />
              )}
              {disc > 0 && <div className="disc-tag">-{disc}%</div>}
            </div>
            <div className="body">
              <div className="title" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {deal.title}
              </div>
              <div className="meta">
                {parseInt(deal.metacriticScore) > 0 && <span>MC {deal.metacriticScore}</span>}
              </div>
              <div className="prices">
                <div>
                  {disc > 0 && <div className="was">${deal.normalPrice}</div>}
                  <div className="now">${parseFloat(deal.salePrice).toFixed(2)}</div>
                </div>
                <div className="stores">
                  via <b>{getStoreName(deal.storeID)}</b>
                </div>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}

function DataList({ deals }: { deals: CheapSharkDeal[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
      {deals.map((deal) => {
        const cover = getSteamCoverUrl(deal.steamAppID);
        const disc = Math.round(parseFloat(deal.savings));
        return (
          <a
            key={deal.dealID}
            href={getDealUrl(deal.dealID)}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="card data"
          >
            <div className="cover">
              {cover ? (
                <Image src={cover} alt={deal.title} width={80} height={100} style={{ objectFit: "cover", width: "100%", height: "100%" }} unoptimized />
              ) : (
                <div style={{ background: `hsl(${(parseInt(deal.gameID, 10) * 37) % 360},38%,22%)`, width: "100%", height: "100%" }} />
              )}
            </div>
            <div className="info">
              <div className="title">{deal.title}</div>
              <div className="meta">
                {parseInt(deal.metacriticScore) > 0 && <span>MC {deal.metacriticScore}</span>}
                {deal.steamRatingText && <span>{deal.steamRatingText}</span>}
              </div>
              <div className="stores-mini">
                <span className="store-pill cheapest">{getStoreName(deal.storeID)}</span>
              </div>
            </div>
            <div className="price-block">
              {disc > 0 && <span className="disc">-{disc}%</span>}
              {disc > 0 && <span className="was">${deal.normalPrice}</span>}
              <span className="now">${parseFloat(deal.salePrice).toFixed(2)}</span>
            </div>
          </a>
        );
      })}
    </div>
  );
}

function ListRows({ deals }: { deals: CheapSharkDeal[] }) {
  return (
    <div className="list-rows">
      <div className="lh">
        <span>#</span>
        <span />
        <span>Title</span>
        <span style={{ textAlign: "right" }}>Sale</span>
        <span style={{ textAlign: "right" }}>Was</span>
        <span style={{ textAlign: "right" }}>Disc</span>
        <span style={{ textAlign: "right" }}>Store</span>
        <span />
      </div>
      {deals.map((deal, i) => {
        const cover = getSteamCoverUrl(deal.steamAppID);
        const disc = Math.round(parseFloat(deal.savings));
        return (
          <a
            key={deal.dealID}
            href={getDealUrl(deal.dealID)}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className={`lr${i === 0 ? " top1" : ""}`}
          >
            <span className="rank">{i + 1}</span>
            <div className="lcover">
              {cover ? (
                <Image src={cover} alt={deal.title} width={50} height={28} style={{ objectFit: "cover", width: "100%", height: "100%" }} unoptimized />
              ) : (
                <div style={{ background: `hsl(${(parseInt(deal.gameID, 10) * 37) % 360},38%,22%)`, width: "100%", height: "100%" }} />
              )}
            </div>
            <div className="ltitle">
              <b>{deal.title}</b>
              {parseInt(deal.metacriticScore) > 0 && <span>MC {deal.metacriticScore}</span>}
            </div>
            <span className="lprice">${parseFloat(deal.salePrice).toFixed(2)}</span>
            <span className="lwas">{disc > 0 ? `$${deal.normalPrice}` : "—"}</span>
            <span className="ldisc">{disc > 0 ? `-${disc}%` : "—"}</span>
            <span className="lstores">{getStoreName(deal.storeID)}</span>
            <span className="lcta">Get deal</span>
          </a>
        );
      })}
    </div>
  );
}
