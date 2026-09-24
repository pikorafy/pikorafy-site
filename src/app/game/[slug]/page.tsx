import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getGameBySlug,
  getGameContent,
  getGamePrices,
  getPlayerHistory,
  getPriceHistory,
  getRelatedGames,
  getTopGameSlugs,
  type Game,
  type GamePrice,
  type PricePoint,
} from "@/lib/catalog";
import { AFFILIATE_DISCLOSURE_SHORT } from "@/lib/affiliate";
import GameDetailClient from "./GameDetailClient";
import GameMedia from "./GameMedia";
import PlayersChart from "./PlayersChart";
import PriceChart from "./PriceChart";
import TimeAgo from "./TimeAgo";

// Catalog pages are prerendered for the most popular games and generated on
// first visit for the rest; either way they refresh at most once an hour
// (the importer updates prices every few hours).
export const revalidate = 3600;

const BASE_URL = "https://pikorafy.com";
const PRERENDER_COUNT = 200;

interface GamePageProps {
  params: Promise<{ slug: string }>;
}

// Numeric IDs are CheapShark game IDs from older deal links; they keep the
// original client-rendered page so existing URLs don't break.
const isLegacyId = (slug: string) => /^\d+$/.test(slug);

export async function generateStaticParams() {
  const slugs = await getTopGameSlugs(PRERENDER_COUNT);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGameBySlug(slug);

  if (!game) {
    if (!isLegacyId(slug)) return {};
    return {
      title: `Game #${slug} — Best Price & Value Analysis | Pikorafy`,
      description: `Compare prices across 30+ stores for game ${slug}. Find the cheapest deal, track price history, and set alerts.`,
    };
  }

  const [prices, content] = await Promise.all([
    getGamePrices(game.steam_app_id),
    getGameContent(game.steam_app_id, "en"),
  ]);
  const best = prices[0];
  const priceText = game.is_free
    ? "free to play"
    : best
      ? `${money(best.price, best.currency)} at ${best.store}${best.discount_pct ? ` (-${best.discount_pct}%)` : ""}`
      : null;

  const description =
    `${game.name} is ${priceText ?? "tracked on Pikorafy"} right now. ` +
    `Compare stores, check the price history and see whether it's a good time to buy.`;
  const images = game.header_image ? [{ url: game.header_image, width: 460, height: 215 }] : undefined;

  return {
    // The root layout's title template appends " | Pikorafy".
    title: `${game.name}: Best Price, Deals & Price History`,
    description,
    alternates: { canonical: `/game/${game.slug}` },
    // Only ask Google to index pages that carry our own written analysis;
    // price-only pages stay out of the index to avoid thin-content signals.
    robots: content ? undefined : { index: false, follow: true },
    openGraph: {
      title: `${game.name} — best price today`,
      description,
      url: `${BASE_URL}/game/${game.slug}`,
      images,
    },
    twitter: {
      title: `${game.name} — best price today`,
      description,
      images,
    },
  };
}

export default async function GamePage({ params }: GamePageProps) {
  const { slug } = await params;
  const game = await getGameBySlug(slug);

  if (!game) {
    if (isLegacyId(slug)) return <GameDetailClient gameId={slug} />;
    notFound();
  }

  const prices = await getGamePrices(game.steam_app_id);
  const currency = prices[0]?.currency ?? "EUR";
  const [history, content, related, players] = await Promise.all([
    getPriceHistory(game.steam_app_id, currency),
    getGameContent(game.steam_app_id, "en"),
    getRelatedGames(game, 6),
    getPlayerHistory(game.steam_app_id),
  ]);

  const best = prices[0];
  const low = lowestPrice(game, history, best, currency);
  const cover = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steam_app_id}/library_600x900.jpg`;
  const instantGamingUrl = `https://www.instant-gaming.com/en/search/?q=${encodeURIComponent(game.name)}&igr=pikorafy`;

  return (
    <>
      <script
        type="application/ld+json"
        // JSON-LD must be inline; escape "<" so names can't close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(game, best)).replace(/</g, "\\u003c") }}
      />

      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section className="detail-hero">
        {game.header_image && (
          <div className="bg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={game.header_image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
        <div className="scrim" />
        <div className="shell inner">
          <div className="cover">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt={`${game.name} cover art`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div>
            <div className="crumbs">
              <Link href="/">Home</Link> / <Link href="/deals">Deals</Link> / <span style={{ color: "var(--text)" }}>{game.name}</span>
            </div>
            <h1>{game.name}</h1>
            <p className="tagline">{heroLine(game, best, low)}</p>
            <div className="stats">
              {best && <Stat value={money(best.price, best.currency)} label="Best price now" />}
              {best?.discount_pct ? <Stat value={`-${best.discount_pct}%`} label="Discount" accent /> : null}
              {low && <Stat value={money(low.price, currency)} label={low.allTime ? "All-time low" : "Lowest we've tracked"} />}
              {game.current_players !== null && <Stat value={compact(game.current_players)} label="Playing now" />}
              {game.review_score_pct !== null && <Stat value={`${game.review_score_pct}%`} label="Positive Steam reviews" />}
              {game.metacritic !== null && <Stat value={String(game.metacritic)} label="Metacritic" />}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
              {best?.url && (
                <a href={best.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: "14px 22px" }}>
                  Buy on {best.store} for {money(best.price, best.currency)} →
                </a>
              )}
              <a href={instantGamingUrl} target="_blank" rel="noopener noreferrer sponsored" className="btn btn-ghost" style={{ padding: "14px 22px" }}>
                Check Instant Gaming →
              </a>
            </div>
            {game.steam_description && !content?.summary && (
              <figure style={{ margin: "28px 0 0", maxWidth: "62ch" }}>
                <blockquote style={{ margin: 0, color: "var(--text-2)", fontSize: 15, lineHeight: 1.7 }}>
                  {game.steam_description}
                </blockquote>
                <figcaption style={{ fontFamily: "var(--ff-mono)", fontSize: 10, color: "var(--text-3)", marginTop: 8, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  From the{" "}
                  <a href={`https://store.steampowered.com/app/${game.steam_app_id}/`} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>
                    Steam store page
                  </a>
                </figcaption>
              </figure>
            )}
          </div>
        </div>
      </section>

      {/* ─── Detail grid ──────────────────────────────────────────────── */}
      <div className="shell detail-grid">
        <div>
          <div className="section-hd" style={{ marginBottom: 16 }}>
            <div>
              <div className="eyebrow">Current offers · prices in {currency}</div>
              <h2 className="h2" style={{ fontSize: "clamp(24px,4vw,32px)" }}>Where to buy {game.name}</h2>
            </div>
          </div>

          <div className="offers">
            <div className="hd">
              <div>#</div>
              <div>Store</div>
              <div>Price</div>
              {/* 4th column is hidden on narrow screens by .offers CSS */}
              <div>Regular price</div>
              <div>Discount</div>
              <div />
            </div>
            {prices.map((p, i) => (
              <div key={`${p.source}-${p.store}`} className={`row ${i === 0 ? "cheapest" : ""}`}>
                <div className="rank">{String(i + 1).padStart(2, "0")}</div>
                <div className="store-block">
                  <div className="store-logo">{p.store.slice(0, 3).toUpperCase()}</div>
                  <div>
                    <div className="sname">{p.store}</div>
                    <div className="smeta">Updated <TimeAgo iso={p.fetched_at} /></div>
                  </div>
                </div>
                <div className="price-cell">
                  <div className="pp">{money(p.price, p.currency)}</div>
                  {i === 0
                    ? <div className="pf delta-zero">↓ cheapest right now</div>
                    : <div className="pf delta-pos">+{money(p.price - best.price, p.currency)} vs cheapest</div>}
                </div>
                <div className="price-cell"><div className="pf" style={{ fontSize: 13 }}>{p.regular_price !== null ? money(p.regular_price, p.currency) : "—"}</div></div>
                <div className="price-cell"><div className="pf" style={{ fontSize: 13 }}>{p.discount_pct ? `-${p.discount_pct}%` : "—"}</div></div>
                {p.url ? (
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="gobtn" style={{ textDecoration: "none", textAlign: "center" }}>Get →</a>
                ) : <div />}
              </div>
            ))}
            <div className="row">
              <div className="rank">··</div>
              <div className="store-block">
                <div className="store-logo">IG</div>
                <div>
                  <div className="sname">Instant Gaming</div>
                  <div className="smeta">Steam keys · often below Steam</div>
                </div>
              </div>
              <div className="price-cell"><div className="pf" style={{ fontSize: 13 }}>See current price</div></div>
              <div />
              <div />
              <a href={instantGamingUrl} target="_blank" rel="noopener noreferrer sponsored" className="gobtn" style={{ textDecoration: "none", textAlign: "center" }}>Check →</a>
            </div>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 10 }}>{AFFILIATE_DISCLOSURE_SHORT}</p>
          {game.is_free && (
            <p style={{ color: "var(--text-2)" }}>{game.name} is free to play on Steam. Offers above, if any, are for paid editions or bundles.</p>
          )}

          <GameMedia name={game.name} steamAppId={game.steam_app_id} trailers={game.trailers} screenshots={game.screenshots} />

          <div className="detail-prose" style={{ marginTop: 32 }}>
            {content?.summary && (
              <>
                <h3>What is {game.name}?</h3>
                {content.summary.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}
              </>
            )}

            {content?.verdict && (
              <>
                <h3>Should you buy {game.name} now?</h3>
                {content.verdict.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}
              </>
            )}

            {content && (content.pros.length > 0 || content.cons.length > 0) && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 24 }}>
                {content.pros.length > 0 && (
                  <div>
                    <h3>Pros</h3>
                    <ul style={{ color: "var(--text-2)", lineHeight: 1.7 }}>{content.pros.map((p) => <li key={p}>{p}</li>)}</ul>
                  </div>
                )}
                {content.cons.length > 0 && (
                  <div>
                    <h3>Cons</h3>
                    <ul style={{ color: "var(--text-2)", lineHeight: 1.7 }}>{content.cons.map((c) => <li key={c}>{c}</li>)}</ul>
                  </div>
                )}
              </div>
            )}

            <div className="tag-row">
              {[...game.genres, ...game.categories.filter((c) => KEY_CATEGORIES.has(c))].map((tag) => (
                <span key={tag} className="t">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Aside */}
        <aside style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="aside-card">
            <h4>Price history</h4>
            {history.length >= 2 ? (
              <>
                <div className="history-chart"><PriceChart points={history} /></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--ff-mono)", fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                  <span>{shortDate(history[0].day)}</span><span>Today</span>
                </div>
              </>
            ) : (
              <p style={{ color: "var(--text-2)", fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                We started tracking {game.name} {history[0] ? `on ${shortDate(history[0].day)}` : "recently"}. The chart appears once we have a few days of prices.
              </p>
            )}
          </div>

          {game.current_players !== null && (
            <div className="aside-card">
              <h4>Players on Steam</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                <MiniStat value={game.current_players} label="Now" />
                {game.peak_players_24h !== null && <MiniStat value={game.peak_players_24h} label="24h peak" />}
                {game.peak_players_30d !== null && <MiniStat value={game.peak_players_30d} label="30-day peak" />}
              </div>
              {players.length >= 2 && (
                <>
                  <div className="history-chart" style={{ height: 100 }}><PlayersChart points={players} /></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--ff-mono)", fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                    <span>{shortDate(players[0].day)}</span><span>Daily peak</span><span>Today</span>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="aside-card">
            <h4>Game info</h4>
            <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 16px", margin: 0, fontSize: 13 }}>
              <InfoRow label="Developer" value={game.developers.join(", ")} />
              <InfoRow label="Publisher" value={game.publishers.join(", ")} />
              <InfoRow label="Released" value={game.coming_soon ? "Coming soon" : game.release_date ? longDate(game.release_date) : ""} />
              <InfoRow label="Reviews" value={game.review_label ? `${game.review_label} (${compact(game.review_count ?? 0)})` : ""} />
              <InfoRow label="Platforms" value={game.platforms.map(platformName).join(", ")} />
            </dl>
            <a href={`https://store.steampowered.com/app/${game.steam_app_id}/`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ justifyContent: "center", width: "100%", marginTop: 16 }}>
              View on Steam →
            </a>
          </div>

          {related.length > 0 && (
            <div className="aside-card">
              <h4>Popular {game.genres.find((g) => g !== "Free To Play") ?? ""} games</h4>
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

// ─── Pieces ──────────────────────────────────────────────────────────────────

function Stat({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <div>
      <div className="v" style={accent ? { color: "var(--accent)" } : undefined}>{value}</div>
      <div className="l">{label}</div>
    </div>
  );
}

function MiniStat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div style={{ fontFamily: "var(--ff-mono)", fontSize: 20, fontWeight: 700 }}>{value.toLocaleString("en")}</div>
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

// ─── Copy built from facts (shown until written content is published) ────────

const KEY_CATEGORIES = new Set(["Single-player", "Multi-player", "Online Co-op", "Co-op", "PvP", "Steam Deck Verified"]);

interface Low { price: number; allTime: boolean }

// Our own history only means something after a couple of weeks; before that we
// rely on IsThereAnyDeal's all-time low, or show nothing.
const MIN_OWN_HISTORY_DAYS = 14;

function lowestPrice(game: Game, history: PricePoint[], best: GamePrice | undefined, currency: string): Low | null {
  const ownLow = history.length ? Math.min(...history.map((p) => p.price)) : null;
  const candidates = [ownLow, best?.price ?? null];
  if (game.history_low_price !== null && game.history_low_currency === currency) {
    return { price: Math.min(game.history_low_price, ...candidates.filter((n): n is number => n !== null)), allTime: true };
  }
  const days = history.length ? (Date.parse(history[history.length - 1].day) - Date.parse(history[0].day)) / 86_400_000 : 0;
  if (ownLow === null || days < MIN_OWN_HISTORY_DAYS) return null;
  return { price: ownLow, allTime: false };
}

function heroLine(game: Game, best: GamePrice | undefined, low: Low | null): string {
  if (game.is_free) return `${game.name} is free to play on Steam.`;
  if (!best) return `We're tracking ${game.name} and will show prices as soon as a store lists it.`;
  const now = money(best.price, best.currency);
  const lowName = low?.allTime ? "its all-time low" : "the lowest price we've tracked";
  if (best.discount_pct) {
    const atLow = low !== null && best.price <= low.price;
    return `${now} at ${best.store}, ${best.discount_pct}% off the regular ${money(best.regular_price ?? best.price, best.currency)}${atLow ? ` — ${lowName}` : ""}.`;
  }
  const seen = low !== null && low.price < best.price ? `; ${low.allTime ? "it has been" : "we've seen it"} as low as ${money(low.price, best.currency)}` : "";
  return `${now} at ${best.store}. It's at full price right now${seen}.`;
}

function jsonLd(game: Game, best: GamePrice | undefined) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.name,
    url: `${BASE_URL}/game/${game.slug}`,
    image: game.header_image ?? undefined,
    genre: game.genres,
    author: game.developers.map((name) => ({ "@type": "Organization", name })),
    publisher: game.publishers.map((name) => ({ "@type": "Organization", name })),
    datePublished: game.release_date ?? undefined,
    gamePlatform: game.platforms.map(platformName),
    offers: best
      ? {
          "@type": "Offer",
          price: best.price.toFixed(2),
          priceCurrency: best.currency,
          url: best.url ?? undefined,
          availability: "https://schema.org/InStock",
          seller: { "@type": "Organization", name: best.store },
        }
      : undefined,
  };
}

// ─── Formatting ──────────────────────────────────────────────────────────────

function money(n: number, currency: string) {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(n);
}

function compact(n: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

function longDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

function platformName(p: string) {
  return ({ windows: "Windows", mac: "macOS", linux: "Linux" } as Record<string, string>)[p] ?? p;
}

