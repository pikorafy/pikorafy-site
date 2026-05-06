"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Store data ──────────────────────────────────────────────────────────────

interface StoreEntry {
  id: string;
  name: string;
  short: string;
  trust: number;
  country: string;
  since: number;
  deals: number;
  refund: string;
  delivery: string;
  activates: string;
  type: "1st-party" | "authorized" | "marketplace";
  url: string;
}

const STORES: StoreEntry[] = [
  // First-party
  { id: "steam",        name: "Steam",            short: "STM", trust: 99, country: "US", since: 2003, deals: 8421, refund: "14d / 2h play", delivery: "Instant",   activates: "Steam",           type: "1st-party",   url: "https://store.steampowered.com/" },
  { id: "gog",          name: "GOG",              short: "GOG", trust: 98, country: "PL", since: 2008, deals: 4112, refund: "30d",           delivery: "Instant",   activates: "GOG / DRM-free",  type: "1st-party",   url: "https://www.gog.com/" },
  { id: "epic",         name: "Epic Games",       short: "EPC", trust: 97, country: "US", since: 2018, deals: 2980, refund: "14d / 2h play", delivery: "Instant",   activates: "Epic Launcher",   type: "1st-party",   url: "https://store.epicgames.com/" },
  // Authorized
  { id: "humble",       name: "Humble Bundle",    short: "HMB", trust: 95, country: "US", since: 2010, deals: 6204, refund: "14d",           delivery: "Instant",   activates: "Steam / Direct",  type: "authorized",  url: "https://www.humblebundle.com/" },
  { id: "fanatical",    name: "Fanatical",        short: "FNT", trust: 94, country: "UK", since: 2014, deals: 5311, refund: "14d",           delivery: "Instant",   activates: "Steam",           type: "authorized",  url: "https://www.fanatical.com/" },
  { id: "gmg",          name: "Green Man Gaming", short: "GMG", trust: 93, country: "UK", since: 2010, deals: 4830, refund: "14d",           delivery: "Instant",   activates: "Steam / Origin",  type: "authorized",  url: "https://www.greenmangaming.com/" },
  { id: "gamebillet",   name: "GameBillet",       short: "GMB", trust: 88, country: "NL", since: 2015, deals: 2104, refund: "14d",           delivery: "Instant",   activates: "Steam",           type: "authorized",  url: "https://www.gamebillet.com/" },
  { id: "wingamestore", name: "WinGameStore",     short: "WGS", trust: 86, country: "US", since: 2008, deals: 1812, refund: "14d",           delivery: "Instant",   activates: "Steam",           type: "authorized",  url: "https://www.wingamestore.com/" },
  { id: "indiegala",    name: "IndieGala",        short: "IGL", trust: 84, country: "IT", since: 2011, deals: 3204, refund: "14d",           delivery: "Instant",   activates: "Steam",           type: "authorized",  url: "https://www.indiegala.com/" },
  { id: "voidu",        name: "Voidu",            short: "VDU", trust: 82, country: "CY", since: 2015, deals: 1608, refund: "14d",           delivery: "1–10 min",  activates: "Steam",           type: "authorized",  url: "https://www.voidu.com/" },
  { id: "gamesplanet",  name: "Gamesplanet",      short: "GMP", trust: 80, country: "FR", since: 2005, deals: 1420, refund: "14d",           delivery: "Instant",   activates: "Steam",           type: "authorized",  url: "https://www.gamesplanet.com/" },
  { id: "gamersgate",   name: "GamersGate",       short: "GGT", trust: 78, country: "SE", since: 2004, deals: 1190, refund: "14d",           delivery: "Instant",   activates: "Steam",           type: "authorized",  url: "https://www.gamersgate.com/" },
  // Marketplace
  { id: "kinguin",      name: "Kinguin",          short: "KIN", trust: 70, country: "HK", since: 2013, deals: 7820, refund: "Marketplace",   delivery: "5–60 min",  activates: "Steam / Origin",  type: "marketplace", url: "https://www.kinguin.net/" },
  { id: "g2a",          name: "G2A",              short: "G2A", trust: 65, country: "HK", since: 2010, deals: 9412, refund: "Marketplace",   delivery: "5–60 min",  activates: "Steam / Origin",  type: "marketplace", url: "https://www.g2a.com/" },
  { id: "eneba",        name: "Eneba",            short: "ENB", trust: 68, country: "LT", since: 2018, deals: 5200, refund: "Marketplace",   delivery: "5–60 min",  activates: "Steam / Multi",   type: "marketplace", url: "https://www.eneba.com/" },
];

type SortKey = "trust" | "deals" | "oldest";

const GROUPS = [
  { key: "1st-party"   as const, title: "First-party",  sub: "Storefronts run by the platforms",  cls: "first" },
  { key: "authorized"  as const, title: "Authorized",   sub: "Licensed resellers, audited",       cls: "auth"  },
  { key: "marketplace" as const, title: "Marketplaces", sub: "Third-party seller markets",        cls: "mkt"   },
];

const METHODOLOGY = [
  { pct: "40%", title: "Chargeback rate",      desc: "The single best signal. We pull verified buyer-protection data from card networks every 7 days. Lower is better; nobody breaks 99 without a near-zero rate." },
  { pct: "25%", title: "Refund policy clarity",desc: 'Stores that hide their refund window or rely on a "marketplace" exemption lose points. Direct, written 14-day windows score full marks.' },
  { pct: "20%", title: "Licensing & sourcing", desc: "First-party publishers and authorized partners earn a flat bonus. Anonymous-seller marketplaces forfeit it." },
  { pct: "15%", title: "Support response time",desc: "We open one anonymous support ticket per store per quarter. Median response time across the last four tickets feeds this score." },
];

export default function StoresClient() {
  const [sort, setSort] = useState<SortKey>("trust");

  const sortFn = (a: StoreEntry, b: StoreEntry) => {
    if (sort === "trust")  return b.trust - a.trust;
    if (sort === "deals")  return b.deals - a.deals;
    return a.since - b.since;
  };

  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section className="stores-hero">
        <div className="shell">
          <div className="eyebrow">Stores · the index of who we trust</div>
          <h1>47 stores. <em>One</em> ranking.<br />Trust score, <em>never</em> paid placement.</h1>
          <p className="lede">
            Every store on Pikorafy goes through the same audit — chargeback rate, regional licensing,
            response time, refund clarity. Trust scores update weekly. The cheapest legit price always
            wins; the cheapest sketchy price never does.
          </p>
          <div className="stat-row">
            <div><div className="v">47</div><div className="l">Stores indexed</div></div>
            <div><div className="v">2 / week</div><div className="l">Audit cadence</div></div>
            <div><div className="v">11,482</div><div className="l">Games tracked</div></div>
            <div><div className="v">$0</div><div className="l">Paid for placement</div></div>
          </div>
        </div>
      </section>

      {/* ─── Sort + Store columns ─────────────────────────────────────── */}
      <section className="section shell">
        {/* Filter bar */}
        <div className="filterbar" style={{ marginBottom: 20 }}>
          <span className="lbl">Sort by</span>
          {([["trust", "Trust score"], ["deals", "Most deals"], ["oldest", "Oldest"]] as [SortKey, string][]).map(([k, l]) => (
            <button
              key={k}
              className="chip"
              aria-pressed={sort === k}
              onClick={() => setSort(k)}
            >
              {l}
            </button>
          ))}
        </div>

        {/* 3 columns */}
        <div className="stores-cols">
          {GROUPS.map((g) => {
            const list = STORES.filter((s) => s.type === g.key).sort(sortFn);
            return (
              <div className={`stores-col ${g.cls}`} key={g.key}>
                <div className="stores-col-hd">
                  <div>
                    <div className="ct">{g.title}</div>
                    <div className="lb">{g.sub}</div>
                  </div>
                  <div className="lb">{list.length} stores</div>
                </div>
                <div className="stores-col-list">
                  {list.map((s, i) => {
                    const barCls = s.trust < 75 ? "low" : s.trust < 88 ? "med" : "";
                    return (
                      <a
                        key={s.id}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`scrow ${i === 0 ? "top1" : ""}`}
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                        <div className="rk">{String(i + 1).padStart(2, "0")}</div>
                        <div className="lg">{s.short}</div>
                        <div className="nm">
                          <b>{s.name}</b>
                          <span>{s.country} · since {s.since}</span>
                          <div className="stats">
                            <span><b>{s.deals.toLocaleString()}</b> deals</span>
                            <span>{s.refund}</span>
                          </div>
                        </div>
                        <div className="ts">
                          <div className="num">{s.trust}</div>
                          <div className={`bar ${barCls}`}>
                            <div style={{ width: `${s.trust}%` }} />
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Ranking methodology ──────────────────────────────────────── */}
      <section className="section shell">
        <div className="section-hd">
          <div>
            <div className="eyebrow">Methodology · how we rank</div>
            <h2 className="h2">Four numbers.<br /><em>That&rsquo;s the whole formula.</em></h2>
          </div>
        </div>
        <div className="ranking-explainer">
          {METHODOLOGY.map((m) => (
            <div key={m.pct}>
              <div className="num">{m.pct}</div>
              <h4>{m.title}</h4>
              <p>{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Get listed CTA ──────────────────────────────────────────── */}
      <section className="section shell" style={{ paddingBottom: "var(--pad-sec)" }}>
        <div style={{
          background: "var(--bg-elev)", border: "1px solid var(--line)",
          borderRadius: "var(--r-lg)", padding: 32,
          display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "center",
        }}>
          <div>
            <div className="eyebrow">Run a store?</div>
            <h3 style={{ fontFamily: "var(--ff-display)", fontSize: 24, fontWeight: 700, margin: "6px 0 8px", letterSpacing: "-0.02em" }}>
              Get listed on Pikorafy.
            </h3>
            <p style={{ color: "var(--text-2)", margin: 0, maxWidth: "60ch" }}>
              If you&rsquo;re a licensed retailer, we&rsquo;d like to audit you. The process is free,
              takes about three weeks, and ends with a public trust score that lives next to your prices forever.
            </p>
          </div>
          <Link href="/contact" className="btn btn-primary" style={{ padding: "14px 24px", whiteSpace: "nowrap" }}>
            Apply for review →
          </Link>
        </div>
      </section>
    </>
  );
}
