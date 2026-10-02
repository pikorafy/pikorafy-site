import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  getGameBySlug,
  getGameContent,
  getGamePrices,
  getPlayerHistory,
  getPriceHistory,
  getRelatedGames,
  getTimeToBeat,
  type Game,
  type GamePrice,
  type PricePoint,
} from "@/lib/catalog";
import { AFFILIATE_DISCLOSURE_SHORT } from "@/lib/affiliate";
import { LOW_TONE, priceTone } from "@/lib/price-tone";
import { MetaStat, MetaStats, PriceTile, PriceTiles } from "@/components/HeroStats";
import { cleanXboxTitle, getSubscriptionNames, getXboxForSteamApp, subscriptionLabels, type XboxGame } from "@/lib/xbox";
import { xboxPlatforms } from "@/components/XboxOffers";
import GameMedia from "./GameMedia";
import PlayersChart from "./PlayersChart";
import PriceChart from "./PriceChart";
import TimeAgo from "./TimeAgo";
import TitlePage, { loadVersionPage, versionMetadata } from "./TitlePage";
import { mainVersion, parseVersionSlug, versionPath, versionsOf, VERSIONS, type Version } from "@/lib/versions";
import { getSlugAlias, getTitleBundle, getTitleBySlug, getTitleForStore, type TitleBundle } from "@/lib/titles";

// Game pages are generated on first visit and cached for six hours. Every regeneration is a
// Vercel ISR write, and crawlers visit thousands of these pages, so the window stays long.
export const revalidate = 21600;

const BASE_URL = "https://pikorafy.com";

interface GamePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  // Nothing at build time: every deploy would rewrite these pages into the ISR cache.
  return [];
}

/**
 * What /game/<slug> shows. A shared title (one game across Steam, PlayStation, Xbox and
 * Switch) has one page per platform version: /game/<slug> for PC (or the first console
 * version of a console-only game) and /game/<slug>-playstation-ps5, -xbox-xbs, -nintendo-nsw2…
 * for the others (src/lib/versions.ts). A Steam slug linked to a title moves to the title's
 * PC page (old links keep working); a Steam game not linked yet keeps its Steam-only page.
 */
async function resolve(slug: string): Promise<
  | { kind: "title"; bundle: TitleBundle; version: Version }
  | { kind: "redirect"; to: string }
  | { kind: "steam"; game: Game }
  | null
> {
  const steam = await getGameBySlug(slug);
  if (steam) {
    const t = await getTitleForStore("steam", steam.steam_app_id);
    if (t && t.slug !== slug) return { kind: "redirect", to: `/game/${t.slug}` };
    if (!t) return { kind: "steam", game: steam };
  }
  let title = await getTitleBySlug(slug);
  let requested: Version | null = null;
  const parsed = title ? null : parseVersionSlug(slug);
  if (parsed) {
    title = await getTitleBySlug(parsed.base);
    requested = parsed.version;
  }
  if (!title) {
    // An old slug (the title was renamed or merged into another): same version, new slug.
    const exact = await getSlugAlias(slug);
    if (exact) return { kind: "redirect", to: `/game/${exact}` };
    const base = parsed ? await getSlugAlias(parsed.base) : null;
    return base && parsed ? { kind: "redirect", to: `/game/${base}-${VERSIONS[parsed.version].suffix}` } : null;
  }
  const bundle = await getTitleBundle(title);
  const versions = versionsOf(bundle);
  const main = mainVersion(versions);
  if (!main) return null;
  // A version the game isn't sold for goes to the main page; each version has one URL.
  if (requested && !versions.includes(requested)) return { kind: "redirect", to: `/game/${title.slug}` };
  const version = requested ?? main;
  const path = versionPath(title.slug, version, versions);
  if (path !== `/game/${slug}`) return { kind: "redirect", to: path };
  return { kind: "title", bundle, version };
}

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { slug } = await params;
  const found = await resolve(slug);
  if (!found || found.kind === "redirect") return {};
  if (found.kind === "title") {
    const steamId = found.bundle.steam?.steam_app_id;
    const [page, written] = await Promise.all([
      loadVersionPage(found.bundle),
      steamId ? getGameContent(steamId, "en") : Promise.resolve(null),
    ]);
    const d = page.data.get(found.version);
    if (!d) return {};
    return versionMetadata(found.bundle, found.version, d, page.versions, !!written);
  }
  const game = found.game;

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
  const found = await resolve(slug);
  if (!found) notFound();
  if (found.kind === "redirect") redirect(found.to);
  if (found.kind === "title") return <TitlePage bundle={found.bundle} version={found.version} />;
  const game = found.game;

  const prices = await getGamePrices(game.steam_app_id);
  const currency = prices[0]?.currency ?? "EUR";
  const [history, content, related, players, xbox, subNames, ttb] = await Promise.all([
    getPriceHistory(game.steam_app_id, currency),
    getGameContent(game.steam_app_id, "en"),
    getRelatedGames(game, 6),
    getPlayerHistory(game.steam_app_id),
    getXboxForSteamApp(game.steam_app_id),
    getSubscriptionNames(),
    getTimeToBeat(game.steam_app_id),
  ]);
  const xboxBest = xbox.find((x) => x.price !== null);
  const xboxIncluded = subscriptionLabels(xbox, subNames);
  const offers = buildOffers(prices, xbox, game.name);

  const best = prices[0];
  const low = lowestPrice(game, history, best, currency);
  // Best PC price coloured by where it sits between its all-time low and its highest price.
  const bestTone = best
    ? priceTone(best.price, low?.price ?? null, Math.max(best.regular_price ?? best.price, ...history.map((h) => h.price)), best.discount_pct)
    : undefined;
  const instantGamingUrl = `https://www.instant-gaming.com/en/search/?q=${encodeURIComponent(game.name)}&igr=pikorafy`;

  return (
    <>
      <script
        type="application/ld+json"
        // JSON-LD must be inline; escape "<" so names can't close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(game, best, xbox.length > 0)).replace(/</g, "\\u003c") }}
      />

      {/* ─── Hero: media on the left, title / price / buy on the right ── */}
      <section className="detail-hero media-hero">
        {game.header_image && (
          <div className="bg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={game.header_image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
        <div className="scrim" />
        <div className="shell inner">
          <div>
            <GameMedia
              name={game.name}
              source={{ label: "Steam", url: `https://store.steampowered.com/app/${game.steam_app_id}/` }}
              keyArt={game.key_art}
              trailers={game.trailers}
              screenshots={game.screenshots}
              inHero
            />
          </div>
          <div className="hero-info">
            <div className="crumbs">
              <Link href="/">Home</Link> / <Link href="/games">Games</Link> / <span style={{ color: "var(--text)" }}>{game.name}</span>
            </div>
            <h1>{game.name}</h1>
            <p className="tagline">{heroLine(game, best, low)}</p>
            {/* Two price tiles side by side; ratings and players in three columns below.
                The Xbox price is on the Xbox Store button and in the offers table. */}
            {best && (
              <PriceTiles>
                <PriceTile
                  label="Best PC price"
                  value={money(best.price, best.currency)}
                  tone={bestTone}
                  badge={best.discount_pct ? `-${best.discount_pct}%` : undefined}
                />
                {low && <PriceTile label={low.allTime ? "All-time low" : "Lowest we've tracked"} value={money(low.price, currency)} tone={LOW_TONE} />}
              </PriceTiles>
            )}
            {(game.current_players !== null || game.review_score_pct !== null || game.metacritic !== null) && (
              <MetaStats>
                {game.current_players !== null && <MetaStat value={compact(game.current_players)} label="Playing now" />}
                {game.review_score_pct !== null && <MetaStat value={`${game.review_score_pct}%`} label="Positive reviews" />}
                {game.metacritic !== null && <MetaStat value={String(game.metacritic)} label="Metacritic" />}
              </MetaStats>
            )}
            <div className="hero-buttons">
              {best?.url && (
                <a href={best.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  Buy on {best.store} for {money(best.price, best.currency)} →
                </a>
              )}
              <a href={instantGamingUrl} target="_blank" rel="noopener noreferrer sponsored" className="btn btn-ghost">
                Check Instant Gaming →
              </a>
              {xboxBest?.store_url && (
                <a href={xboxBest.store_url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                  Xbox Store{xboxBest.is_free ? "" : ` · ${money(xboxBest.price!, xboxBest.currency ?? "EUR")}`} →
                </a>
              )}
            </div>
            {game.steam_description && !content?.summary && (
              <figure style={{ margin: "22px 0 0" }}>
                <blockquote style={{ margin: 0, color: "var(--text-2)", fontSize: 14, lineHeight: 1.65 }}>
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
            <div className="tag-row" style={{ marginTop: 18 }}>
              {[...game.genres, ...game.categories.filter((c) => KEY_CATEGORIES.has(c))].map((tag) => (
                <span key={tag} className="t">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Detail grid ──────────────────────────────────────────────── */}
      <div className="shell detail-grid">
        <div>
          <div className="section-hd" style={{ marginBottom: 16 }}>
            <div>
              <div className="eyebrow">Current offers{xbox.length ? " · PC & Xbox" : ""} · prices in {currency}</div>
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
            {offers.map((o, i) => {
              const cheapest = offers[0];
              return (
                <div key={o.key} className={`row ${i === 0 && o.price !== null ? "cheapest" : ""}`}>
                  <div className="rank">{String(i + 1).padStart(2, "0")}</div>
                  <div className="store-block">
                    <div className="store-logo">{o.logo}</div>
                    <div>
                      <div className="sname">{o.store}</div>
                      <div className="smeta">
                        {xbox.length > 0 && <><span className={`plat ${o.platform === "Xbox" ? "xbox" : ""}`}>{o.platform}</span> · </>}
                        {o.meta}
                      </div>
                    </div>
                  </div>
                  <div className="price-cell">
                    <div className="pp">{o.free ? "Free" : o.price !== null ? money(o.price, o.currency) : "—"}</div>
                    {o.price === null
                      ? <div className="pf">See the store</div>
                      : i === 0
                        ? <div className="pf delta-zero">↓ cheapest right now</div>
                        : cheapest.price !== null && cheapest.currency === o.currency
                          ? <div className="pf delta-pos">+{money(o.price - cheapest.price, o.currency)} vs cheapest</div>
                          : null}
                  </div>
                  <div className="price-cell"><div className="pf" style={{ fontSize: 13 }}>{o.regular_price ? money(o.regular_price, o.currency) : "—"}</div></div>
                  <div className="price-cell"><div className="pf" style={{ fontSize: 13 }}>{o.discount_pct ? `-${o.discount_pct}%` : "—"}</div></div>
                  {o.url ? (
                    <a href={o.url} target="_blank" rel="noopener noreferrer" className="gobtn" style={{ textDecoration: "none", textAlign: "center" }}>Get →</a>
                  ) : <div />}
                </div>
              );
            })}
            <div className="row">
              <div className="rank">··</div>
              <div className="store-block">
                <div className="store-logo">IG</div>
                <div>
                  <div className="sname">Instant Gaming</div>
                  <div className="smeta">{xbox.length > 0 && <><span className="plat">PC</span> · </>}Steam keys · often below Steam</div>
                </div>
              </div>
              <div className="price-cell"><div className="pf" style={{ fontSize: 13 }}>See current price</div></div>
              <div />
              <div />
              <a href={instantGamingUrl} target="_blank" rel="noopener noreferrer sponsored" className="gobtn" style={{ textDecoration: "none", textAlign: "center" }}>Check →</a>
            </div>
          </div>
          {xboxIncluded.length > 0 && (
            <p className="xbox-included" style={{ margin: "12px 0 0" }}>
              <span aria-hidden>✓</span> On Xbox, included with {xboxIncluded.join(", ")}
            </p>
          )}
          <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 10 }}>{AFFILIATE_DISCLOSURE_SHORT}</p>
          {game.is_free && (
            <p style={{ color: "var(--text-2)" }}>{game.name} is free to play on Steam. Offers above, if any, are for paid editions or bundles.</p>
          )}

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

          {ttb && (
            <div className="aside-card">
              <h4>How long to beat</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                <TimeStat minutes={ttb.main_min} label="Main story" />
                {ttb.extras_min !== null && <TimeStat minutes={ttb.extras_min} label="Main + extras" />}
                {ttb.full_min !== null && <TimeStat minutes={ttb.full_min} label="100%" />}
              </div>
              <p style={{ color: "var(--text-3)", fontSize: 12, margin: "14px 0 0", lineHeight: 1.5 }}>
                Average of {ttb.submissions} player times on{" "}
                {ttb.igdb_slug
                  ? <a href={`https://www.igdb.com/games/${ttb.igdb_slug}`} target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>IGDB</a>
                  : "IGDB"}
                . Your time may vary.
              </p>
            </div>
          )}

          <div className="aside-card">
            <h4>Game info</h4>
            <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 16px", margin: 0, fontSize: 13 }}>
              <InfoRow label="Developer" value={game.developers.join(", ")} />
              <InfoRow label="Publisher" value={game.publishers.join(", ")} />
              <InfoRow label="Released" value={game.coming_soon ? "Coming soon" : game.release_date ? longDate(game.release_date) : ""} />
              <InfoRow label="Reviews" value={game.review_label ? `${game.review_label} (${compact(game.review_count ?? 0)})` : ""} />
              <InfoRow label="Platforms" value={[...game.platforms.map(platformName), ...xboxPlatforms(xbox)].join(", ")} />
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

interface OfferRow {
  key: string;
  store: string;
  logo: string;
  platform: "PC" | "Xbox";
  meta: React.ReactNode;
  price: number | null;
  free: boolean;
  currency: string;
  regular_price: number | null;
  discount_pct: number | null;
  url: string | null;
}

/** PC store offers and Xbox Store editions in one list, cheapest first. */
function buildOffers(prices: GamePrice[], xbox: XboxGame[], name: string): OfferRow[] {
  const pc: OfferRow[] = prices.map((p) => ({
    key: `${p.source}-${p.store}`,
    store: p.store,
    logo: p.store.slice(0, 3).toUpperCase(),
    platform: "PC",
    meta: <>Updated <TimeAgo iso={p.fetched_at} /></>,
    price: p.price,
    free: false,
    currency: p.currency,
    regular_price: p.regular_price,
    discount_pct: p.discount_pct,
    url: p.url,
  }));
  // Unpriced Xbox products are usually delisted editions; keep one only if nothing is sold.
  const sold = xbox.filter((x) => x.price !== null);
  const console_: OfferRow[] = (sold.length ? sold : xbox.slice(0, 1)).map((x) => {
    const edition = cleanXboxTitle(x.title);
    return {
      key: `xbox-${x.product_id}`,
      store: "Xbox Store",
      logo: "XBX",
      platform: "Xbox",
      meta: [
        edition.toLowerCase() !== name.toLowerCase() ? edition : "",
        xboxPlatforms([x]).map((pl) => pl.replace(/^Xbox (?=Series|One)/, "")).join(" · "),
      ].filter(Boolean).join(" · "),
      price: x.price,
      free: x.is_free,
      currency: x.currency ?? "EUR",
      regular_price: x.regular_price,
      discount_pct: x.discount_pct,
      url: x.store_url,
    };
  });
  return [...pc, ...console_].sort((a, b) => (a.price === null ? 1 : 0) - (b.price === null ? 1 : 0) || (a.price ?? 0) - (b.price ?? 0));
}

function MiniStat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div style={{ fontFamily: "var(--ff-mono)", fontSize: 20, fontWeight: 700 }}>{value.toLocaleString("en")}</div>
      <div style={{ fontFamily: "var(--ff-mono)", fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>{label}</div>
    </div>
  );
}

/** 45 min · 12 h · 33½ h (rounded to the half hour; whole hours from 50 h). */
function formatPlaytime(minutes: number): string {
  if (minutes < 60) return `${Math.max(5, Math.round(minutes / 5) * 5)} min`;
  const halves = Math.round(minutes / 30);
  if (minutes >= 50 * 60 || halves % 2 === 0) return `${Math.round(minutes / 60)} h`;
  return `${Math.floor(halves / 2)}½ h`;
}

function TimeStat({ minutes, label }: { minutes: number; label: string }) {
  return (
    <div>
      <div style={{ fontFamily: "var(--ff-mono)", fontSize: 20, fontWeight: 700 }}>{formatPlaytime(minutes)}</div>
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

function jsonLd(game: Game, best: GamePrice | undefined, onXbox: boolean) {
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
    gamePlatform: [...game.platforms.map(platformName), ...(onXbox ? ["Xbox"] : [])],
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

