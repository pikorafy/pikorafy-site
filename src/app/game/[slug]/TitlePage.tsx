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
  type SteamScreenshot,
  type SteamTrailer,
} from "@/lib/catalog";
import { AFFILIATE_DISCLOSURE_SHORT } from "@/lib/affiliate";
import { LOW_TONE, priceTone } from "@/lib/price-tone";
import { igdbImage, type TitleBundle } from "@/lib/titles";
import { getSubscriptionNames, subscriptionLabels } from "@/lib/xbox";
import { PLUS_TIER_LABEL, psStoreUrl, type PsGameDetail } from "@/lib/playstation";
import { nintendoPlatformLabel, nintendoStoreUrl, type NintendoGameDetail } from "@/lib/nintendo";
import { MetaStat, MetaStats, PriceTile, PriceTiles } from "@/components/HeroStats";
import XboxOffers, { xboxPlatforms } from "@/components/XboxOffers";
import FallbackImg from "@/components/FallbackImg";
import GameMedia from "./GameMedia";
import PlatformTabs, { type PlatformPanel } from "./PlatformTabs";
import PlayersChart from "./PlayersChart";
import PriceChart from "./PriceChart";
import TimeAgo from "./TimeAgo";

// The shared game page: one game across Steam (and the PC stores ITAD tracks), the
// PlayStation Store, the Xbox Store and the Nintendo eShop, one tab per platform.
// Store data comes through each store's own helpers (lib/titles.ts → getTitleBundle).

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

interface PlatformBest { key: string; label: string; price: number | null; free: boolean; currency: string; store: string; url: string | null; discount: number | null }

/** Lowest current price per platform, for the hero tiles and the tab labels. */
function platformBests(b: TitleBundle, pc: GamePrice[]): PlatformBest[] {
  const out: PlatformBest[] = [];
  if (b.steam || pc.length) {
    const p = pc[0];
    out.push({ key: "pc", label: "PC", price: p?.price ?? null, free: !!b.steam?.is_free && !p, currency: p?.currency ?? "EUR", store: p?.store ?? "Steam", url: p?.url ?? null, discount: p?.discount_pct ?? null });
  }
  const cheapest = <T extends { price: number | null; is_free: boolean }>(xs: T[]) =>
    xs.filter((x) => x.price !== null || x.is_free).sort((a, c) => (a.is_free ? 0 : a.price!) - (c.is_free ? 0 : c.price!))[0];
  if (b.playstation.length) {
    const p = cheapest(b.playstation) ?? b.playstation[0];
    out.push({ key: "playstation", label: "PlayStation", price: p.price, free: p.is_free, currency: p.currency ?? "EUR", store: "PlayStation Store", url: psStoreUrl(p), discount: p.discount_pct });
  }
  if (b.xbox) {
    const p = cheapest(b.xboxEditions) ?? b.xbox;
    out.push({ key: "xbox", label: "Xbox", price: p.price, free: p.is_free, currency: p.currency ?? "EUR", store: "Xbox Store", url: p.store_url, discount: p.discount_pct });
  }
  if (b.nintendo.length) {
    const p = cheapest(b.nintendo) ?? b.nintendo[0];
    out.push({ key: "switch", label: "Switch", price: p.price, free: p.is_free, currency: p.currency ?? "EUR", store: "Nintendo eShop", url: nintendoStoreUrl(p), discount: p.discount_pct });
  }
  return out;
}

/** Wide art, sharpest official source first: Steam, PlayStation, Xbox, Nintendo, then IGDB. */
function wideArt(b: TitleBundle): string[] {
  const ps = b.playstation[0];
  const nin = b.nintendo[0];
  return [
    ...(b.steam?.key_art ? [b.steam.key_art.src, ...b.steam.key_art.fallbacks] : []),
    ...(ps?.key_art ? [ps.key_art.src, ...ps.key_art.fallbacks] : []),
    ...(b.xbox?.key_art ? [b.xbox.key_art.src, ...b.xbox.key_art.fallbacks] : []),
    ...(nin?.key_art ? [nin.key_art.src, ...nin.key_art.fallbacks] : []),
    ...(b.title.art_id ? [igdbImage(b.title.art_id, "t_1080p")] : []),
    ...(b.title.cover_id ? [igdbImage(b.title.cover_id, "t_1080p")] : []),
  ].filter((u, i, all) => !!u && all.indexOf(u) === i);
}

/** Trailers and screenshots from the richest store: Steam, then Xbox, then PlayStation. */
function media(b: TitleBundle): { trailers: SteamTrailer[]; screenshots: SteamScreenshot[]; source: { label: string; url: string } } {
  if (b.steam && (b.steam.trailers.length || b.steam.screenshots.length)) {
    return { trailers: b.steam.trailers, screenshots: b.steam.screenshots, source: { label: "Steam", url: `https://store.steampowered.com/app/${b.steam.steam_app_id}/` } };
  }
  if (b.xbox && (b.xbox.trailers.length || b.xbox.screenshots.length)) {
    const x = b.xbox;
    return {
      trailers: x.trailers.map((t, i) => {
        const thumb = t.thumb ?? x.hero_art ?? x.box_art ?? "";
        return { id: i + 1, name: t.name, hls: t.hls, thumb: thumb ? `${thumb}?w=1280` : "" };
      }),
      screenshots: x.screenshots.map((url) => ({ thumb: `${url}?w=400`, full: `${url}?w=1920` })),
      source: { label: "Xbox", url: x.store_url ?? "https://www.xbox.com" },
    };
  }
  const ps = b.playstation[0];
  if (ps) return { trailers: [], screenshots: ps.screenshots, source: { label: "PlayStation Store", url: psStoreUrl(ps) } };
  const nin = b.nintendo[0];
  return { trailers: [], screenshots: [], source: { label: nin ? "Nintendo" : "IGDB", url: (nin && nintendoStoreUrl(nin)) ?? `https://www.igdb.com/games/${b.title.slug}` } };
}

export function titleMetadata(b: TitleBundle, pc: GamePrice[], indexable: boolean): Metadata {
  const bests = platformBests(b, pc);
  const platforms = bests.map((p) => (p.key === "playstation" ? "PS5" : p.label));
  const priced = bests.filter((p) => p.price !== null).sort((a, c) => a.price! - c.price!);
  const description =
    `${b.title.name} on ${listOf(bests.map((p) => p.label))}` +
    (priced[0] ? `: from ${money(priced[0].price!, priced[0].currency)} on the ${priced[0].store} right now. ` : ". ") +
    `Compare store prices${bests.length > 1 ? " across platforms" : ""}, deals and price history.`;
  const image = wideArt(b)[0];
  const images = image ? [{ url: image }] : undefined;
  return {
    title: `${b.title.name}: Best Price on ${listOf(platforms)}`,
    description,
    alternates: { canonical: `/game/${b.title.slug}` },
    // As before: only pages carrying our own written analysis are indexed.
    robots: indexable ? undefined : { index: false, follow: true },
    openGraph: { title: `${b.title.name} — best price today`, description, url: `${BASE_URL}/game/${b.title.slug}`, images },
    twitter: { title: `${b.title.name} — best price today`, description, images },
  };
}

export default async function TitlePage({ bundle: b }: { bundle: TitleBundle }) {
  const steam = b.steam;
  const pcPrices = steam ? await getGamePrices(steam.steam_app_id) : [];
  const currency = pcPrices[0]?.currency ?? "EUR";
  const [history, content, related, players, ttb, subNames] = await Promise.all([
    steam ? getPriceHistory(steam.steam_app_id, currency) : Promise.resolve([]),
    steam ? getGameContent(steam.steam_app_id, "en") : Promise.resolve(null),
    steam ? getRelatedGames(steam, 6) : Promise.resolve([]),
    steam ? getPlayerHistory(steam.steam_app_id) : Promise.resolve([]),
    steam ? getTimeToBeat(steam.steam_app_id) : Promise.resolve(null),
    getSubscriptionNames(),
  ]);

  const name = b.title.name;
  const bests = platformBests(b, pcPrices);
  const priced = bests.filter((p) => p.price !== null).sort((a, c) => a.price! - c.price!);
  const overall = priced[0];
  const art = wideArt(b);
  const m = media(b);
  const genres = b.title.genres.length ? b.title.genres : steam?.genres ?? [];
  const summary = b.title.summary ?? steam?.steam_description ?? b.xbox?.short_description ?? null;
  const instantGamingUrl = `https://www.instant-gaming.com/en/search/?q=${encodeURIComponent(name)}&igr=pikorafy`;
  const pcLow = history.length ? Math.min(...history.map((h) => h.price)) : null;

  const panels: PlatformPanel[] = [];
  if (bests.some((p) => p.key === "pc")) {
    panels.push({ key: "pc", label: "PC", note: noteFor(bests.find((p) => p.key === "pc")!), content: (
      <>
        <OfferGroup title="Official stores" offers={pcOffers(pcPrices)} empty={`No PC store lists ${name} right now.`} />
        <OfferGroup title="Keyshops" offers={[{
          key: "instant-gaming", store: "Instant Gaming", logo: "IG", meta: "Steam keys · often below Steam", price: null, free: false,
          currency: "EUR", regular: null, discount: null, url: instantGamingUrl, note: "See current price", sponsored: true,
        }]} />
        {steam?.is_free && <p style={{ color: "var(--text-2)" }}>{name} is free to play on Steam. Offers above, if any, are for paid editions or bundles.</p>}
      </>
    ) });
  }
  if (b.playstation.length) {
    const best = bests.find((p) => p.key === "playstation")!;
    panels.push({ key: "playstation", label: "PlayStation", note: noteFor(best), content: <OfferGroup title="Official store" offers={b.playstation.map(psOffer)} footer={psFooter(b.playstation)} /> });
  }
  if (b.xbox) {
    const best = bests.find((p) => p.key === "xbox")!;
    panels.push({ key: "xbox", label: "Xbox", note: noteFor(best), content: <XboxOffers name={name} products={b.xboxEditions} included={subscriptionLabels(b.xboxEditions, subNames)} first /> });
  }
  if (b.nintendo.length) {
    const best = bests.find((p) => p.key === "switch")!;
    panels.push({ key: "switch", label: "Switch", note: noteFor(best), content: <OfferGroup title="Official store" offers={b.nintendo.map(nintendoOffer)} footer={nintendoFooter(b.nintendo)} /> });
  }

  return (
    <>
      <script
        type="application/ld+json"
        // JSON-LD must be inline; escape "<" so names can't close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(b, bests, art[0])).replace(/</g, "\\u003c") }}
      />

      {/* ─── Hero: media on the left, title / prices / buy on the right ── */}
      <section className="detail-hero media-hero">
        {art.length > 0 && (
          <div className="bg">
            <FallbackImg srcs={art} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
        <div className="scrim" />
        <div className="shell inner">
          <div>
            <GameMedia
              name={name}
              source={m.source}
              keyArt={art.length ? { src: art[0], fallbacks: art.slice(1) } : null}
              trailers={m.trailers}
              screenshots={m.screenshots}
              inHero
            />
          </div>
          <div className="hero-info">
            <div className="crumbs">
              <Link href="/">Home</Link> / <Link href="/games">Games</Link> / <span style={{ color: "var(--text)" }}>{name}</span>
            </div>
            <h1>{name}</h1>
            <p className="tagline">
              On {listOf(bests.map((p) => p.label))}.
              {overall ? ` Best price right now: ${money(overall.price!, overall.currency)} on the ${overall.store}${overall.discount ? ` (-${overall.discount}%)` : ""}.` : ""}
            </p>
            {bests.length > 0 && (
              <PriceTiles>
                {bests.map((p) => (
                  <PriceTile
                    key={p.key}
                    label={`${p.label} · ${p.store}`}
                    value={p.free ? "Free" : p.price !== null ? money(p.price, p.currency) : "—"}
                    tone={p.free ? LOW_TONE : p.price !== null ? priceTone(p.price, p.key === "pc" ? pcLow : null, null, p.discount) : undefined}
                    badge={p.discount ? `-${p.discount}%` : undefined}
                  />
                ))}
              </PriceTiles>
            )}
            <HeroStats b={b} />
            <div className="hero-buttons">
              {overall?.url && (
                <a href={overall.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  Buy on the {overall.store} for {money(overall.price!, overall.currency)} →
                </a>
              )}
              {bests.some((p) => p.key === "pc") && (
                <a href={instantGamingUrl} target="_blank" rel="noopener noreferrer sponsored" className="btn btn-ghost">Check Instant Gaming →</a>
              )}
            </div>
            {summary && !content?.summary && (
              <figure style={{ margin: "22px 0 0" }}>
                <blockquote style={{ margin: 0, color: "var(--text-2)", fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-line" }}>
                  {clip(summary, 420)}
                </blockquote>
                <figcaption style={{ fontFamily: "var(--ff-mono)", fontSize: 10, color: "var(--text-3)", marginTop: 8, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  {b.title.summary ? "Summary from IGDB" : steam?.steam_description ? "From the Steam store page" : "From the Xbox Store page"}
                </figcaption>
              </figure>
            )}
            <div className="tag-row" style={{ marginTop: 18 }}>
              {[...genres, ...bests.map((p) => p.label)].map((tag) => <span key={tag} className="t">{tag}</span>)}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Detail grid ──────────────────────────────────────────────── */}
      <div className="shell detail-grid">
        <div>
          <div className="section-hd" style={{ marginBottom: 16 }}>
            <div>
              <div className="eyebrow">Current offers · {bests.length} platform{bests.length === 1 ? "" : "s"} · prices in EUR</div>
              <h2 className="h2" style={{ fontSize: "clamp(24px,4vw,32px)" }}>Where to buy {name}</h2>
            </div>
          </div>
          {panels.length ? <PlatformTabs panels={panels} /> : <p style={{ color: "var(--text-2)" }}>No store lists {name} right now.</p>}
          <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 14 }}>{AFFILIATE_DISCLOSURE_SHORT}</p>

          <div className="detail-prose" style={{ marginTop: 32 }}>
            {content?.summary && (
              <>
                <h3>What is {name}?</h3>
                {content.summary.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}
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

        {/* Aside */}
        <aside style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {steam && (
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

          {steam && steam.current_players !== null && (
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

          <div className="aside-card">
            <h4>Game info</h4>
            <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 16px", margin: 0, fontSize: 13 }}>
              <InfoRow label="Developer" value={steam?.developers.join(", ") || b.xbox?.developer || b.nintendo[0]?.developer || ""} />
              <InfoRow label="Publisher" value={steam?.publishers.join(", ") || b.xbox?.publisher || b.playstation[0]?.publisher || b.nintendo[0]?.publisher || ""} />
              <InfoRow label="Released" value={(b.title.first_release ?? steam?.release_date) ? longDate((b.title.first_release ?? steam?.release_date)!) : ""} />
              <InfoRow label="Platforms" value={platformNames(b).join(", ")} />
              <InfoRow label="Genre" value={genres.join(", ")} />
            </dl>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
              {storeLinks(b).map((s) => (
                <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ justifyContent: "center" }}>{s.label} →</a>
              ))}
            </div>
          </div>

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

function psOffer(g: PsGameDetail): Offer {
  const plus = g.plus_tier ? PLUS_TIER_LABEL[g.plus_tier] ?? "PS Plus" : null;
  return {
    key: `ps-${g.igdb_id}`, store: "PlayStation Store", logo: "PS",
    meta: <><span className="plat">{g.platforms.join(" / ")}</span>{g.store_name && g.store_name !== g.title ? ` · ${g.store_name}` : ""}</>,
    price: g.price, free: g.is_free, currency: g.currency ?? "EUR", regular: g.regular_price, discount: g.discount_pct, url: psStoreUrl(g),
    note: g.sales_status === "preorder" ? "Pre-order" : g.price === null ? (plus ? `In ${plus}` : "See the store") : undefined,
  };
}

function psFooter(games: PsGameDetail[]): string {
  const g = games[0];
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
    meta: <><span className="plat">{g.platforms.map(nintendoPlatformLabel).join(" / ")}</span> · Digital · Spain</>,
    price: g.price, free: g.is_free, currency: g.currency ?? "EUR", regular: g.regular_price, discount: g.discount_pct, url: nintendoStoreUrl(g),
    note: g.sales_status === "preorder" ? "Pre-order" : g.sales_status === "unreleased" ? "Coming soon" : g.price === null ? "See the store" : undefined,
  };
}

function nintendoFooter(games: NintendoGameDetail[]): string {
  const g = games.find((x) => x.discount_pct && x.discount_ends_at);
  return `Prices from the Spanish eShop, checked every six hours.${g ? ` This discount ends ${longDate(g.discount_ends_at!)}.` : ""}`;
}

/** One offers table ("Official stores", "Keyshops"…), cheapest first. */
function OfferGroup({ title, offers, empty, footer }: { title: string; offers: Offer[]; empty?: string; footer?: string }) {
  const sorted = [...offers].sort((a, c) => (a.price === null ? 1 : 0) - (c.price === null ? 1 : 0) || (a.price ?? 0) - (c.price ?? 0));
  const cheapest = sorted[0];
  return (
    <section className="offer-group">
      <h3 className="offer-group-title">{title}</h3>
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
                  {o.note ?? (i === 0 ? "↓ cheapest right now" : cheapest.price !== null && o.price !== null ? `+${money(o.price - cheapest.price, o.currency)} vs cheapest` : "")}
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

function HeroStats({ b }: { b: TitleBundle }) {
  const stats: { value: string; label: string }[] = [];
  if (b.steam?.current_players != null) stats.push({ value: compact(b.steam.current_players), label: "Playing now on Steam" });
  if (b.steam?.review_score_pct != null) stats.push({ value: `${b.steam.review_score_pct}%`, label: "Positive on Steam" });
  const ps = b.playstation.find((g) => g.star_rating !== null);
  if (ps) stats.push({ value: `${ps.star_rating!.toFixed(1)}★`, label: "PS Store rating" });
  if (b.xbox?.rating != null && (b.xbox.rating_count ?? 0) > 0) stats.push({ value: `★ ${b.xbox.rating.toFixed(1)}`, label: "Xbox rating" });
  if (b.steam?.metacritic != null) stats.push({ value: String(b.steam.metacritic), label: "Metacritic" });
  if (!stats.length) return null;
  return <MetaStats>{stats.slice(0, 3).map((s) => <MetaStat key={s.label} value={s.value} label={s.label} />)}</MetaStats>;
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

function platformNames(b: TitleBundle): string[] {
  const out: string[] = [];
  if (b.steam) out.push("PC");
  for (const g of b.playstation) out.push(...g.platforms);
  if (b.xbox) out.push(...xboxPlatforms(b.xboxEditions, !b.steam));
  for (const g of b.nintendo) out.push(...g.platforms.map(nintendoPlatformLabel));
  return [...new Set(out)];
}

function storeLinks(b: TitleBundle): { label: string; url: string }[] {
  const out: { label: string; url: string }[] = [];
  if (b.steam) out.push({ label: "View on Steam", url: `https://store.steampowered.com/app/${b.steam.steam_app_id}/` });
  if (b.playstation[0]) out.push({ label: "View on the PlayStation Store", url: psStoreUrl(b.playstation[0]) });
  if (b.xbox?.store_url) out.push({ label: "View on the Xbox Store", url: b.xbox.store_url });
  const ns = b.nintendo[0] && nintendoStoreUrl(b.nintendo[0]);
  if (ns) out.push({ label: "View on Nintendo.com", url: ns });
  return out;
}

function noteFor(p: PlatformBest): string | undefined {
  if (p.free) return "Free";
  return p.price !== null ? `from ${money(p.price, p.currency)}` : undefined;
}

function jsonLd(b: TitleBundle, bests: PlatformBest[], image: string | undefined) {
  const prices = bests.filter((p) => p.price !== null).map((p) => p.price!);
  return {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: b.title.name,
    url: `${BASE_URL}/game/${b.title.slug}`,
    image,
    genre: b.title.genres,
    datePublished: b.title.first_release ?? undefined,
    gamePlatform: platformNames(b),
    offers: prices.length
      ? { "@type": "AggregateOffer", lowPrice: Math.min(...prices).toFixed(2), highPrice: Math.max(...prices).toFixed(2), priceCurrency: "EUR", offerCount: prices.length }
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

/** "PC, PlayStation and Xbox". */
function listOf(xs: string[]): string {
  return xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
}

function clip(s: string, n: number): string {
  return s.length <= n ? s : `${s.slice(0, s.lastIndexOf(" ", n))}…`;
}

/** 45 min · 12 h · 33½ h (rounded to the half hour; whole hours from 50 h). */
function playtime(minutes: number): string {
  if (minutes < 60) return `${Math.max(5, Math.round(minutes / 5) * 5)} min`;
  const halves = Math.round(minutes / 30);
  if (minutes >= 50 * 60 || halves % 2 === 0) return `${Math.round(minutes / 60)} h`;
  return `${Math.floor(halves / 2)}½ h`;
}
