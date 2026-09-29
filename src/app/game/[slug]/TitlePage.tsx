import type { Metadata } from "next";
import Link from "next/link";
import {
  getGameContent,
  getGamePrices,
  getPlayerHistory,
  getPriceHistory,
  getRelatedGames,
  getTimeToBeat,
  type GamePrice,
  type KeyArt,
  type SteamScreenshot,
  type SteamTrailer,
} from "@/lib/catalog";
import { AFFILIATE_DISCLOSURE_SHORT } from "@/lib/affiliate";
import { igdbImage, type TitleBundle } from "@/lib/titles";
import { cleanXboxTitle, getSubscriptionNames, subscriptionLabels, type XboxGame } from "@/lib/xbox";
import { PLUS_TIER_LABEL, psStoreUrl, type PsGameDetail } from "@/lib/playstation";
import { nintendoStoreUrl, type NintendoGameDetail } from "@/lib/nintendo";
import {
  microsoftPc, nintendoFor, psFor, VERSIONS, versionPath, versionsOf, xboxFor, type Version,
} from "@/lib/versions";
import FallbackImg from "@/components/FallbackImg";
import GameMedia from "./GameMedia";
import PlayersChart from "./PlayersChart";
import PriceChart from "./PriceChart";
import TimeAgo from "./TimeAgo";

// One version of a shared game (PC, PS5, PS4, Xbox Series, Xbox One, Switch 2, Switch):
// its own URL (lib/versions.ts), hero and offers, with links to the game's other versions
// above the hero. Store data comes through each store's helpers (lib/titles.ts).

const BASE_URL = "https://pikorafy.com";

interface Offer {
  key: string;
  store: string;
  logo: string;
  meta: React.ReactNode;
  price: number | null;
  free: boolean;
  currency: string;
  regular: number | null;
  discount: number | null;
  url: string | null;
  note?: string;
  sponsored?: boolean;
}

interface VersionData {
  version: Version;
  official: Offer[];
  keyshops: Offer[];
  subscriptions: string[];
  editions: string[];
  art: string[];
  store: { label: string; url: string } | null;
  footer: string | null;
  release: string | null;
  media: { trailers: SteamTrailer[]; screenshots: SteamScreenshot[] };
}

const cheapest = (offers: Offer[]) =>
  offers.filter((o) => o.price !== null || o.free).sort((a, b) => (a.free ? 0 : a.price!) - (b.free ? 0 : b.price!))[0];
const uniq = <T,>(xs: T[]) => [...new Set(xs)];
const artOf = (k: KeyArt | null | undefined) => (k ? [k.src, ...k.fallbacks] : []);

function igdbArt(b: TitleBundle): string[] {
  return [
    ...(b.title.art_id ? [igdbImage(b.title.art_id, "t_1080p")] : []),
    ...(b.title.cover_id ? [igdbImage(b.title.cover_id, "t_1080p")] : []),
  ];
}

/** Everything one version's page shows. */
function versionData(b: TitleBundle, v: Version, pcPrices: GamePrice[], subNames: Map<string, string>): VersionData {
  const name = b.title.name;
  switch (v) {
    case "pc": {
      const ms = microsoftPc(b);
      return {
        version: v,
        official: [...pcOffers(pcPrices), ...ms.map((x) => xboxOffer(x, name, "Microsoft Store", "MS"))],
        keyshops: [{
          key: "instant-gaming", store: "Instant Gaming", logo: "IG", meta: "Steam keys · often below Steam", price: null, free: false,
          currency: "EUR", regular: null, discount: null, url: instantGaming(name), note: "See current price", sponsored: true,
        }],
        subscriptions: subscriptionLabels(ms, subNames),
        editions: [],
        art: uniq([...artOf(b.steam?.key_art), ...artOf(b.xbox?.key_art), ...igdbArt(b)]),
        store: b.steam ? { label: "View on Steam", url: `https://store.steampowered.com/app/${b.steam.steam_app_id}/` } : ms[0]?.store_url ? { label: "View on Microsoft Store", url: ms[0].store_url } : null,
        footer: b.steam?.is_free ? `${name} is free to play on Steam. Offers above, if any, are for paid editions or bundles.` : null,
        release: b.steam?.release_date ?? b.title.first_release,
        media: b.steam ? { trailers: b.steam.trailers, screenshots: b.steam.screenshots } : xboxMedia(b),
      };
    }
    case "ps5": case "ps4": {
      const games = psFor(b, v);
      const plus = uniq(games.map((g) => g.plus_tier).filter((t): t is string => !!t).map((t) => PLUS_TIER_LABEL[t] ?? "PS Plus"));
      return {
        version: v,
        official: games.map(psOffer),
        keyshops: [],
        subscriptions: plus,
        editions: uniq(games.map((g) => g.store_name ?? g.title)),
        art: uniq([...games.flatMap((g) => artOf(g.key_art)), ...artOf(b.steam?.key_art), ...igdbArt(b)]),
        store: games[0] ? { label: "View on PlayStation Store", url: psStoreUrl(games[0]) } : null,
        footer: psFooter(games),
        release: games[0]?.release_date ?? b.title.first_release,
        media: { trailers: [], screenshots: games[0]?.screenshots ?? [] },
      };
    }
    case "xbs": case "xb1": {
      const products = xboxFor(b, v);
      const main = products.find((x) => x.is_primary) ?? products[0];
      return {
        version: v,
        official: products.map((x) => xboxOffer(x, name, "Xbox Store", "XBX")),
        keyshops: [],
        subscriptions: subscriptionLabels(products, subNames),
        editions: uniq(products.map((x) => cleanXboxTitle(x.title))),
        art: uniq([...artOf(b.xbox?.key_art), ...products.flatMap((x) => [x.hero_art, x.box_art].filter((u): u is string => !!u).map((u) => `${u}?w=1600`)), ...igdbArt(b)]),
        store: main?.store_url ? { label: "View on Microsoft Store", url: main.store_url } : null,
        footer: "Prices from the Spanish Xbox Store.",
        release: b.xbox?.release_date ?? b.title.first_release,
        media: xboxMedia(b),
      };
    }
    case "nsw2": case "nsw": {
      const games = nintendoFor(b, v);
      const url = games[0] ? nintendoStoreUrl(games[0]) : null;
      return {
        version: v,
        official: games.map(nintendoOffer),
        keyshops: [],
        subscriptions: [],
        editions: uniq(games.map((g) => g.title)),
        art: uniq([...games.flatMap((g) => artOf(g.key_art)), ...igdbArt(b)]),
        store: url ? { label: "View on Nintendo eShop", url } : null,
        footer: nintendoFooter(games),
        release: games[0]?.release_date ?? b.title.first_release,
        media: { trailers: [], screenshots: [] },
      };
    }
  }
}

function xboxMedia(b: TitleBundle): VersionData["media"] {
  const x = b.xbox;
  if (!x) return { trailers: [], screenshots: [] };
  return {
    trailers: x.trailers.map((t, i) => {
      const thumb = t.thumb ?? x.hero_art ?? x.box_art ?? "";
      return { id: i + 1, name: t.name, hls: t.hls, thumb: thumb ? `${thumb}?w=1280` : "" };
    }),
    screenshots: x.screenshots.map((url) => ({ thumb: `${url}?w=400`, full: `${url}?w=1920` })),
  };
}

// ─── Page data and metadata ──────────────────────────────────────────────────

export async function loadVersionPage(b: TitleBundle) {
  const pcPrices = b.steam ? await getGamePrices(b.steam.steam_app_id) : [];
  const subNames = await getSubscriptionNames();
  const versions = versionsOf(b);
  const data = new Map(versions.map((v) => [v, versionData(b, v, pcPrices, subNames)]));
  return { versions, data, pcPrices };
}

export function versionMetadata(b: TitleBundle, version: Version, d: VersionData, versions: Version[], indexable: boolean): Metadata {
  const long = VERSIONS[version].long;
  const best = cheapest([...d.official, ...d.keyshops]);
  const description =
    `${b.title.name} for ${long}` +
    (best && best.price !== null ? `: ${money(best.price, best.currency)} at ${best.store} right now${best.discount ? ` (-${best.discount}%)` : ""}. ` : ". ") +
    `Compare ${long} prices from official stores${d.keyshops.length ? " and keyshops" : ""}, deals and price history.`;
  const path = versionPath(b.title.slug, version, versions);
  const images = d.art[0] ? [{ url: d.art[0] }] : undefined;
  return {
    title: `${b.title.name} ${VERSIONS[version].label}: Best Price & Deals`,
    description,
    alternates: { canonical: path },
    // As before: only pages carrying our own written analysis are indexed.
    robots: indexable ? undefined : { index: false, follow: true },
    openGraph: { title: `${b.title.name} (${long}) — best price today`, description, url: `${BASE_URL}${path}`, images },
    twitter: { title: `${b.title.name} (${long}) — best price today`, description, images },
  };
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function TitlePage({ bundle: b, version }: { bundle: TitleBundle; version: Version }) {
  const { versions, data, pcPrices } = await loadVersionPage(b);
  const d = data.get(version)!;
  const steam = b.steam;
  const onPc = version === "pc" && !!steam;
  const currency = pcPrices[0]?.currency ?? "EUR";
  const [history, content, related, players, ttb] = await Promise.all([
    onPc ? getPriceHistory(steam.steam_app_id, currency) : Promise.resolve([]),
    steam ? getGameContent(steam.steam_app_id, "en") : Promise.resolve(null),
    onPc ? getRelatedGames(steam, 6) : Promise.resolve([]),
    onPc ? getPlayerHistory(steam.steam_app_id) : Promise.resolve([]),
    steam ? getTimeToBeat(steam.steam_app_id) : Promise.resolve(null),
  ]);

  const name = b.title.name;
  const info = VERSIONS[version];
  const bestOfficial = cheapest(d.official);
  const bestKeyshop = cheapest(d.keyshops);
  const best = cheapest([...d.official, ...d.keyshops]);
  const genres = b.title.genres.length ? b.title.genres : steam?.genres ?? [];
  const summary = b.title.summary ?? steam?.steam_description ?? b.xbox?.short_description ?? null;

  const hasMedia = d.art.length > 0 || d.media.trailers.length > 0 || d.media.screenshots.length > 0;
  const mediaSource = d.store ? { label: d.store.label.replace(/^View on /, ""), url: d.store.url } : { label: "IGDB", url: `https://www.igdb.com/games/${b.title.slug}` };

  return (
    <>
      <script
        type="application/ld+json"
        // JSON-LD must be inline; escape "<" so names can't close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(b, version, d, versions)).replace(/</g, "\\u003c") }}
      />

      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section className="vp-hero-wrap">
        {d.art.length > 0 && (
          <div className="vp-bg" aria-hidden>
            <FallbackImg srcs={d.art} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
        <div className="shell vp-inner">
          <div className="crumbs vp-crumbs">
            <Link href="/">Home</Link> / <Link href="/games">Games</Link> / <span>{name}</span>
          </div>

          <div className={`vp-hero fam-${info.family}`}>
            {/* Big media on the left: key art, trailers and screenshots when we have them. */}
            <div className="vp-stage">
              {hasMedia ? (
                <GameMedia
                  name={name}
                  source={mediaSource}
                  keyArt={d.art.length ? { src: d.art[0], fallbacks: d.art.slice(1) } : null}
                  trailers={d.media.trailers}
                  screenshots={d.media.screenshots}
                  inHero
                />
              ) : (
                <div className="vp-cover"><div className="vp-cover-empty">{name}</div></div>
              )}
            </div>

            <div className="vp-main">
              <span className="vp-badge">{info.long}</span>
              <h1>{name}</h1>
              {d.editions.length > 1 && (
                <div className="vp-editions">
                  <span>Editions:</span>
                  {d.editions.slice(0, 5).map((e) => <span key={e} className="vp-edition">{editionLabel(e, name)}</span>)}
                </div>
              )}
              <p className="vp-lede">{heroLine(name, info.long, d, best)}</p>

              {/* Versions: each its own page, with its best price, right above this version's prices. */}
              {versions.length > 1 && (
                <nav className="vp-versions" aria-label="Versions">
                  {versions.map((v) => {
                    const vb = cheapest([...data.get(v)!.official, ...data.get(v)!.keyshops]);
                    return (
                      <Link key={v} href={versionPath(b.title.slug, v, versions)} className={`vp-version fam-${VERSIONS[v].family}`}
                        aria-current={v === version ? "page" : undefined}>
                        <span className="vp-version-label">{VERSIONS[v].label}</span>
                        <span className="vp-version-price">{vb ? (vb.free ? "Free" : money(vb.price!, vb.currency)) : "—"}</span>
                      </Link>
                    );
                  })}
                </nav>
              )}

              <div className="vp-prices" aria-label="Current prices">
                <div className="vp-price-grid">
                  <PriceCell label="Official stores" offer={bestOfficial} />
                  <PriceCell label="Keyshops" offer={bestKeyshop} link={version === "pc" ? instantGaming(name) : undefined} />
                </div>
                <div className="vp-subs">
                  <span>Subscriptions:</span>{" "}
                  {d.subscriptions.length ? d.subscriptions.join(", ") : <span className="vp-dim">—</span>}
                </div>
              </div>

              <div className="hero-buttons">
                {best?.url && best.price !== null && (
                  <a href={best.url} target="_blank" rel={`noopener noreferrer${best.sponsored ? " sponsored" : ""}`} className="btn btn-primary">
                    Buy at {best.store} for {money(best.price, best.currency)} →
                  </a>
                )}
                {d.store && (
                  <a href={d.store.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">{d.store.label} ↗</a>
                )}
                {version === "pc" && (
                  <a href={instantGaming(name)} target="_blank" rel="noopener noreferrer sponsored" className="btn btn-ghost">Check Instant Gaming →</a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Offers + side column ─────────────────────────────────────── */}
      <div className="shell detail-grid">
        <div>
          <OfferGroup title={`Official stores · ${info.long}`} offers={d.official} empty={`No official store lists ${name} for ${info.long} right now.`} footer={d.footer} />
          {d.keyshops.length > 0 && <OfferGroup title="Keyshops" offers={d.keyshops} />}
          <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 14 }}>{AFFILIATE_DISCLOSURE_SHORT}</p>

          <div className="detail-prose" style={{ marginTop: 32 }}>
            {content?.summary ? (
              <>
                <h3>What is {name}?</h3>
                {content.summary.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}
              </>
            ) : summary && (
              <>
                <h3>About {name}</h3>
                <p style={{ whiteSpace: "pre-line" }}>{summary}</p>
              </>
            )}
            {content?.verdict && (
              <>
                <h3>Should you buy {name} now?</h3>
                {content.verdict.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}
              </>
            )}
          </div>
        </div>

        <aside style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="aside-card">
            <h4>Game info</h4>
            <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 16px", margin: 0, fontSize: 13 }}>
              <InfoRow label="Released" value={d.release ? longDate(d.release) : ""} />
              <InfoRow label="Platform" value={info.long} />
              <InfoRow label="Also on" value={versions.filter((v) => v !== version).map((v) => VERSIONS[v].label).join(", ")} />
              <InfoRow label="Developer" value={steam?.developers.join(", ") || b.xbox?.developer || b.nintendo[0]?.developer || ""} />
              <InfoRow label="Publisher" value={steam?.publishers.join(", ") || b.xbox?.publisher || b.playstation[0]?.publisher || b.nintendo[0]?.publisher || ""} />
              <InfoRow label="Genre" value={genres.join(", ")} />
            </dl>
          </div>

          {onPc && (
            <div className="aside-card">
              <h4>PC price history</h4>
              {history.length >= 2 ? (
                <>
                  <div className="history-chart"><PriceChart points={history} /></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--ff-mono)", fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                    <span>{shortDate(history[0].day)}</span><span>Today</span>
                  </div>
                </>
              ) : (
                <p style={{ color: "var(--text-2)", fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                  We started tracking {name} {history[0] ? `on ${shortDate(history[0].day)}` : "recently"}. The chart appears once we have a few days of prices.
                </p>
              )}
            </div>
          )}

          {onPc && steam.current_players !== null && (
            <div className="aside-card">
              <h4>Players on Steam</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                <MiniStat value={steam.current_players.toLocaleString("en")} label="Now" />
                {steam.peak_players_24h !== null && <MiniStat value={steam.peak_players_24h.toLocaleString("en")} label="24h peak" />}
                {steam.peak_players_30d !== null && <MiniStat value={steam.peak_players_30d.toLocaleString("en")} label="30-day peak" />}
              </div>
              {players.length >= 2 && <div className="history-chart" style={{ height: 100 }}><PlayersChart points={players} /></div>}
            </div>
          )}

          {ttb && (
            <div className="aside-card">
              <h4>How long to beat</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                <MiniStat value={playtime(ttb.main_min)} label="Main story" />
                {ttb.extras_min !== null && <MiniStat value={playtime(ttb.extras_min)} label="Main + extras" />}
                {ttb.full_min !== null && <MiniStat value={playtime(ttb.full_min)} label="100%" />}
              </div>
              <p style={{ color: "var(--text-3)", fontSize: 12, margin: "14px 0 0", lineHeight: 1.5 }}>
                Average of {ttb.submissions} player times on IGDB. Your time may vary.
              </p>
            </div>
          )}

          {related.length > 0 && (
            <div className="aside-card">
              <h4>Popular {genres.find((g) => g !== "Free To Play") ?? ""} games</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {related.map((r) => (
                  <Link key={r.slug} href={`/game/${r.slug}`} style={{ display: "flex", gap: 12, alignItems: "center", textDecoration: "none", color: "inherit" }}>
                    {r.header_image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.header_image} alt="" width={92} height={43} style={{ borderRadius: 3, objectFit: "cover", flexShrink: 0 }} />
                    )}
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{r.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

// ─── Offers ──────────────────────────────────────────────────────────────────

function pcOffers(prices: GamePrice[]): Offer[] {
  return prices.map((p) => ({
    key: `${p.source}-${p.store}`, store: p.store, logo: p.store.slice(0, 3).toUpperCase(),
    meta: <>Updated <TimeAgo iso={p.fetched_at} /></>,
    price: p.price, free: false, currency: p.currency, regular: p.regular_price, discount: p.discount_pct, url: p.url,
  }));
}

function xboxOffer(x: XboxGame, name: string, store: string, logo: string): Offer {
  const edition = cleanXboxTitle(x.title);
  return {
    key: `xbox-${x.product_id}`, store, logo,
    meta: edition.toLowerCase() !== name.toLowerCase() ? edition : "Standard edition",
    price: x.price, free: x.is_free, currency: x.currency ?? "EUR", regular: x.regular_price, discount: x.discount_pct, url: x.store_url,
    note: x.price === null && !x.is_free ? "See the store" : undefined,
  };
}

function psOffer(g: PsGameDetail): Offer {
  const plus = g.plus_tier ? PLUS_TIER_LABEL[g.plus_tier] ?? "PS Plus" : null;
  return {
    key: `ps-${g.igdb_id}`, store: "PlayStation Store", logo: "PS",
    meta: <><span className="plat">{g.platforms.join(" / ")}</span>{g.store_name && g.store_name !== g.title ? ` · ${g.store_name}` : ""}</>,
    price: g.price, free: g.is_free, currency: g.currency ?? "EUR", regular: g.regular_price, discount: g.discount_pct, url: psStoreUrl(g),
    note: g.sales_status === "preorder" ? "Pre-order" : g.price === null ? (plus ? `In ${plus}` : "See the store") : undefined,
  };
}

function psFooter(games: PsGameDetail[]): string | null {
  const g = games[0];
  if (!g) return null;
  const plus = g.plus_tier ? PLUS_TIER_LABEL[g.plus_tier] ?? "PS Plus" : null;
  return [
    "Prices from the Spanish PlayStation Store.",
    g.discount_pct && g.discount_ends_at ? `This discount ends ${longDate(g.discount_ends_at)}.` : "",
    g.lowest_30d !== null ? `Lowest in the last 30 days: ${money(g.lowest_30d, g.currency ?? "EUR")}.` : "",
    plus ? `Included at no extra cost with ${plus}.` : "",
    g.plus_price !== null ? `PS Plus members pay ${money(g.plus_price, g.currency ?? "EUR")}.` : "",
  ].filter(Boolean).join(" ");
}

function nintendoOffer(g: NintendoGameDetail): Offer {
  return {
    key: `ns-${g.nsuid}`, store: "Nintendo eShop", logo: "NS",
    meta: <>{g.title} · Digital · Spain</>,
    price: g.price, free: g.is_free, currency: g.currency ?? "EUR", regular: g.regular_price, discount: g.discount_pct, url: nintendoStoreUrl(g),
    note: g.sales_status === "preorder" ? "Pre-order" : g.sales_status === "unreleased" ? "Coming soon" : g.price === null ? "See the store" : undefined,
  };
}

function nintendoFooter(games: NintendoGameDetail[]): string {
  const g = games.find((x) => x.discount_pct && x.discount_ends_at);
  return `Prices from the Spanish eShop, checked every six hours.${g ? ` This discount ends ${longDate(g.discount_ends_at!)}.` : ""}`;
}

/** One offers table, cheapest first. */
function OfferGroup({ title, offers, empty, footer }: { title: string; offers: Offer[]; empty?: string; footer?: string | null }) {
  const sorted = [...offers].sort((a, c) => (a.price === null ? 1 : 0) - (c.price === null ? 1 : 0) || (a.price ?? 0) - (c.price ?? 0));
  const first = sorted[0];
  return (
    <section className="offer-group">
      <h2 className="offer-group-title">{title}</h2>
      {sorted.length === 0 ? (
        <p style={{ color: "var(--text-2)", margin: 0 }}>{empty ?? "Nothing listed right now."}</p>
      ) : (
        <div className="offers">
          <div className="hd">
            <div>#</div>
            <div>Store</div>
            <div>Price</div>
            <div>Regular price</div>
            <div>Discount</div>
            <div />
          </div>
          {sorted.map((o, i) => (
            <div key={o.key} className={`row ${i === 0 && o.price !== null && !o.sponsored ? "cheapest" : ""}`}>
              <div className="rank">{String(i + 1).padStart(2, "0")}</div>
              <div className="store-block">
                <div className="store-logo">{o.logo}</div>
                <div>
                  <div className="sname">{o.store}</div>
                  <div className="smeta">{o.meta}</div>
                </div>
              </div>
              <div className="price-cell">
                <div className="pp">{o.free ? "Free" : o.price !== null ? money(o.price, o.currency) : "—"}</div>
                <div className="pf">
                  {o.note ?? (i === 0 ? "↓ cheapest right now" : first.price !== null && o.price !== null ? `+${money(o.price - first.price, o.currency)} vs cheapest` : "")}
                </div>
              </div>
              <div className="price-cell"><div className="pf" style={{ fontSize: 13 }}>{o.regular ? money(o.regular, o.currency) : "—"}</div></div>
              <div className="price-cell"><div className="pf" style={{ fontSize: 13 }}>{o.discount ? `-${o.discount}%` : "—"}</div></div>
              {o.url ? (
                <a href={o.url} target="_blank" rel={`noopener noreferrer${o.sponsored ? " sponsored" : ""}`} className="gobtn" style={{ textDecoration: "none", textAlign: "center" }}>
                  {o.price === null && o.sponsored ? "Check →" : "Get →"}
                </a>
              ) : <div />}
            </div>
          ))}
        </div>
      )}
      {footer && <p style={{ color: "var(--text-3)", fontSize: 12, margin: "10px 0 0" }}>{footer}</p>}
    </section>
  );
}

// ─── Pieces ──────────────────────────────────────────────────────────────────

function PriceCell({ label, offer, link }: { label: string; offer: Offer | undefined; link?: string }) {
  return (
    <div className="vp-price">
      <div className="vp-price-label">{label}</div>
      {offer ? (
        <>
          <div className="vp-price-value">{offer.free ? "Free" : money(offer.price!, offer.currency)}</div>
          <div className="vp-price-meta">
            {offer.discount ? <span className="vp-disc">-{offer.discount}%</span> : null}
            <span>{offer.store}</span>
          </div>
        </>
      ) : link ? (
        <a href={link} target="_blank" rel="noopener noreferrer sponsored" className="vp-price-check">Check prices →</a>
      ) : (
        <div className="vp-price-value vp-dim">—</div>
      )}
    </div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div style={{ fontFamily: "var(--ff-mono)", fontSize: 20, fontWeight: 700 }}>{value}</div>
      <div style={{ fontFamily: "var(--ff-mono)", fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>{label}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <>
      <dt style={{ color: "var(--text-3)" }}>{label}</dt>
      <dd style={{ margin: 0 }}>{value}</dd>
    </>
  );
}

/** "Deluxe Edition" rather than the full store title, when the game's name is a prefix of it. */
function editionLabel(edition: string, name: string): string {
  const e = edition.replace(/[™®]/g, "").trim();
  const n = name.replace(/[™®]/g, "").trim();
  if (e.toLowerCase() === n.toLowerCase()) return "Standard";
  if (e.toLowerCase().startsWith(n.toLowerCase())) return e.slice(n.length).replace(/^[\s:–—-]+/, "") || "Standard";
  return e;
}

function heroLine(name: string, long: string, d: VersionData, best: Offer | undefined): string {
  const stores = uniq([...d.official, ...d.keyshops].map((o) => o.store));
  if (!best || best.price === null && !best.free) {
    return `We track ${name} for ${long}, but no store lists a price right now.${d.subscriptions.length ? ` It's included with ${d.subscriptions.join(" and ")}.` : ""}`;
  }
  const price = best.free ? "free" : `${money(best.price!, best.currency)} at ${best.store}${best.discount ? `, ${best.discount}% off` : ""}`;
  return `${stores.length} store${stores.length === 1 ? "" : "s"} sell ${name} for ${long}. The best price right now is ${price}.` +
    (d.subscriptions.length ? ` Also included with ${d.subscriptions.join(" and ")}.` : "");
}

function instantGaming(name: string): string {
  return `https://www.instant-gaming.com/en/search/?q=${encodeURIComponent(name)}&igr=pikorafy`;
}

function jsonLd(b: TitleBundle, version: Version, d: VersionData, versions: Version[]) {
  const prices = [...d.official, ...d.keyshops].filter((o) => o.price !== null).map((o) => o.price!);
  return {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: b.title.name,
    url: `${BASE_URL}${versionPath(b.title.slug, version, versions)}`,
    image: d.art[0],
    genre: b.title.genres,
    datePublished: d.release ?? undefined,
    gamePlatform: VERSIONS[version].long,
    offers: prices.length
      ? { "@type": "AggregateOffer", lowPrice: Math.min(...prices).toFixed(2), highPrice: Math.max(...prices).toFixed(2), priceCurrency: "EUR", offerCount: prices.length }
      : undefined,
  };
}

// ─── Formatting ──────────────────────────────────────────────────────────────

function money(n: number, currency: string) {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(n);
}

function longDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

/** 45 min · 12 h · 33½ h (rounded to the half hour; whole hours from 50 h). */
function playtime(minutes: number): string {
  if (minutes < 60) return `${Math.max(5, Math.round(minutes / 5) * 5)} min`;
  const halves = Math.round(minutes / 30);
  if (minutes >= 50 * 60 || halves % 2 === 0) return `${Math.round(minutes / 60)} h`;
  return `${Math.floor(halves / 2)}½ h`;
}
