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
  /** The store's product name, when it says more than the game's name (edition, bundle). */
  listing?: string;
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

const FAMILY_LINK: Record<string, { label: string; href: string }> = {
  pc: { label: "PC", href: "/games" },
  playstation: { label: "PlayStation", href: "/playstation" },
  xbox: { label: "Xbox", href: "/xbox" },
  nintendo: { label: "Nintendo", href: "/nintendo" },
};

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
  const family = FAMILY_LINK[info.family];
  const bestOfficial = cheapest(d.official);
  const bestKeyshop = cheapest(d.keyshops);
  const best = cheapest([...d.official, ...d.keyshops]);
  const low = history.length ? Math.min(...history.map((p) => p.price)) : null;
  const genres = b.title.genres.length ? b.title.genres : steam?.genres ?? [];
  const summary = b.title.summary ?? steam?.steam_description ?? b.xbox?.short_description ?? null;
  const developer = steam?.developers.join(", ") || b.xbox?.developer || b.nintendo[0]?.developer || "";
  const publisher = steam?.publishers.join(", ") || b.xbox?.publisher || b.playstation[0]?.publisher || b.nintendo[0]?.publisher || "";
  const editions = d.editions.length > 1 ? d.editions : [];
  const offerCount = d.official.length + d.keyshops.length;
  const hasAbout = !!(content?.summary || summary || content?.verdict);

  // Portrait IGDB cover first, then the store's art; the wide art is the backdrop.
  const cover = uniq([...(b.title.cover_id ? [igdbImage(b.title.cover_id, "t_cover_big_2x")] : []), ...d.art]);
  const hasMedia = d.art.length > 0 || d.media.trailers.length > 0 || d.media.screenshots.length > 0;
  const mediaSource = d.store ? { label: d.store.label.replace(/^View on /, ""), url: d.store.url } : { label: "IGDB", url: `https://www.igdb.com/games/${b.title.slug}` };

  // The version columns: one per platform family, newest console on top.
  const families = uniq(versions.map((v) => VERSIONS[v].family));

  return (
    <>
      <script
        type="application/ld+json"
        // JSON-LD must be inline; escape "<" so names can't close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(b, version, d, versions)).replace(/</g, "\\u003c") }}
      />

      {/* ─── Hero: cover | title, versions, verdict | prices ──────────── */}
      <section className="pp-hero">
        {d.art.length > 0 && (
          <div className="pp-art" aria-hidden>
            <FallbackImg srcs={d.art} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
        <div className="shell pp-hero-inner">
          <div className="pp-crumbs">
            <Link href="/">Home</Link> / <Link href={family.href}>{family.label}</Link> / <span>{info.label}</span>
          </div>
          <div className="pp-hero-grid">
            <div className={`pp-cover pf-${info.family}`}>
              <span className="pp-strip">{info.long}</span>
              {cover.length > 0
                ? <FallbackImg srcs={cover} alt={`${name} cover`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div className="pp-cover-empty">{name}</div>}
            </div>

            <div className="pp-main">
              <h1>{name}</h1>
              <div className="pp-meta">
                {(publisher || developer) && <span>{uniq([developer, publisher].filter(Boolean)).join(" · ")}</span>}
                {d.release && <span>Released {longDate(d.release)}</span>}
                {genres.length > 0 && <span>{genres.slice(0, 3).join(" · ")}</span>}
              </div>
              {versions.length > 1 && (
                <nav className="pp-versions" aria-label="Versions">
                  {families.map((f) => (
                    <div key={f} className="pp-ver-col">
                      {versions.filter((v) => VERSIONS[v].family === f).map((v) => (
                        <Link key={v} href={versionPath(b.title.slug, v, versions)} className={`pp-ver pf-${f}`}
                          aria-current={v === version ? "page" : undefined}>
                          <span className="pp-pf" aria-hidden />{VERSIONS[v].label}
                        </Link>
                      ))}
                    </div>
                  ))}
                </nav>
              )}
              <p className="pp-verdict">{verdict(version, d, best, low, data, versions)}</p>
            </div>

            <div className="pp-panel" aria-label="Current prices">
              <div className="pp-panel-cols">
                <PriceColumn label="Official stores" offer={bestOfficial} empty="Not listed" />
                <PriceColumn label="Keyshops" offer={bestKeyshop}
                  empty={version === "pc" ? undefined : "No offers yet"}
                  check={version === "pc" ? { label: "Check Instant Gaming", url: instantGaming(name) } : undefined} />
              </div>
              <div className="pp-panel-foot">
                {low !== null
                  ? <div><span>Lowest we&apos;ve recorded</span><span className="num">{money(low, currency)}</span></div>
                  : bestOfficial?.regular && <div><span>Regular price</span><span className="num">{money(bestOfficial.regular, bestOfficial.currency)}</span></div>}
                <div><span>Subscriptions</span><span>{d.subscriptions.length ? d.subscriptions.join(", ") : "Not included"}</span></div>
                {ttb && <div><span>Time to beat</span><span>{playtime(ttb.main_min)} story</span></div>}
              </div>
              <div className="pp-actions">
                {best?.url && best.price !== null && (
                  <a href={best.url} target="_blank" rel={`noopener noreferrer${best.sponsored ? " sponsored" : ""}`} className="pp-btn pp-btn-primary">
                    Buy at {best.store} · <span className="num">{money(best.price, best.currency)}</span>
                  </a>
                )}
                {offerCount > 1 && <a href="#offers" className="pp-btn pp-btn-ghost">Compare all {offerCount} offers</a>}
                {offerCount <= 1 && d.store && (
                  <a href={d.store.url} target="_blank" rel="noopener noreferrer" className="pp-btn pp-btn-ghost">{d.store.label} ↗</a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Sections: only the ones with something in them ──────────── */}
      <div className="shell">
        <nav className="pp-tabs" aria-label="Sections">
          <a href="#offers" aria-current="true">Offers <small>{offerCount}</small></a>
          {editions.length > 0 && <a href="#editions">Editions <small>{editions.length}</small></a>}
          {onPc && <a href="#history">Price history</a>}
          {hasAbout && <a href="#about">About</a>}
        </nav>

        <div className="pp-body">
          <div className="pp-content">
            <section id="offers" className="pp-section">
              <div className="pp-section-h"><h2>Official stores</h2><span>{info.long}</span></div>
              <OfferList offers={d.official} empty={`No official store lists ${name} for ${info.long} right now.`} />
              {d.footer && <p className="pp-note">{d.footer}</p>}
            </section>

            <section className="pp-section">
              <div className="pp-section-h"><h2>Keyshops</h2><span>Codes from resellers</span></div>
              <OfferList offers={d.keyshops} empty="No keyshop sells a code for this version yet. They'll show up here, with each seller's trust level, when one does." />
            </section>
            <p className="pp-note">{AFFILIATE_DISCLOSURE_SHORT}</p>

            {editions.length > 0 && (
              <section id="editions" className="pp-section">
                <div className="pp-section-h"><h2>Editions</h2><span>{info.long}</span></div>
                <div className="pp-list">
                  {editions.map((e) => {
                    const o = cheapest(d.official.filter((x) => x.listing === e));
                    return (
                      <div key={e} className="pp-row">
                        <div className="pp-row-main"><b>{editionLabel(e, name)}</b><small>{e}</small></div>
                        <div className="pp-row-price num">{o ? (o.free ? "Free" : money(o.price!, o.currency)) : "—"}</div>
                        {o?.url ? <a href={o.url} target="_blank" rel="noopener noreferrer" className="pp-go">Go to store</a> : <span />}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {onPc && (
              <section id="history" className="pp-section">
                <div className="pp-section-h"><h2>Price history</h2><span>Lowest price across PC stores, per day</span></div>
                {history.length >= 2 ? (
                  <div className="pp-card">
                    <div className="history-chart"><PriceChart points={history} /></div>
                    <div className="pp-chart-axis"><span>{shortDate(history[0].day)}</span><span>Today</span></div>
                  </div>
                ) : (
                  <p className="pp-empty">We started tracking {name} {history[0] ? `on ${shortDate(history[0].day)}` : "recently"}. The chart appears once we have a few days of prices.</p>
                )}
              </section>
            )}

            {hasAbout && (
              <section id="about" className="pp-section detail-prose">
                {content?.summary ? (
                  <>
                    <h2>What is {name}?</h2>
                    {content.summary.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}
                  </>
                ) : summary && (
                  <>
                    <h2>About {name}</h2>
                    <p style={{ whiteSpace: "pre-line" }}>{summary}</p>
                  </>
                )}
                {content?.verdict && (
                  <>
                    <h3>Should you buy {name} now?</h3>
                    {content.verdict.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}
                  </>
                )}
              </section>
            )}
          </div>

          <aside className="pp-side">
            {hasMedia && (
              <div className="pp-card">
                <h3>Trailers and screenshots</h3>
                <GameMedia
                  name={name}
                  source={mediaSource}
                  keyArt={d.art.length ? { src: d.art[0], fallbacks: d.art.slice(1) } : null}
                  trailers={d.media.trailers}
                  screenshots={d.media.screenshots}
                  inHero
                />
              </div>
            )}

            <div className="pp-card">
              <h3>Game info</h3>
              <dl className="pp-info">
                <InfoRow label="Platform" value={info.long} />
                <InfoRow label="Also on" value={versions.filter((v) => v !== version).map((v) => VERSIONS[v].label).join(", ")} />
                <InfoRow label="Released" value={d.release ? longDate(d.release) : ""} />
                <InfoRow label="Developer" value={developer} />
                <InfoRow label="Publisher" value={publisher} />
                <InfoRow label="Genre" value={genres.join(", ")} />
                {ttb && (
                  <InfoRow label="Time to beat" value={[`${playtime(ttb.main_min)} story`, ttb.extras_min !== null ? `${playtime(ttb.extras_min)} with extras` : "", ttb.full_min !== null ? `${playtime(ttb.full_min)} for 100%` : ""].filter(Boolean).join(" · ")} />
                )}
              </dl>
            </div>

            {onPc && steam.current_players !== null && (
              <div className="pp-card">
                <h3>Players on Steam</h3>
                <div className="pp-stats">
                  <MiniStat value={steam.current_players.toLocaleString("en")} label="Now" />
                  {steam.peak_players_24h !== null && <MiniStat value={steam.peak_players_24h.toLocaleString("en")} label="24h peak" />}
                  {steam.peak_players_30d !== null && <MiniStat value={steam.peak_players_30d.toLocaleString("en")} label="30-day peak" />}
                </div>
                {players.length >= 2 && <div className="history-chart" style={{ height: 100 }}><PlayersChart points={players} /></div>}
              </div>
            )}

            {related.length > 0 && (
              <div className="pp-card">
                <h3>Popular {genres.find((g) => g !== "Free To Play") ?? ""} games</h3>
                <div className="pp-related">
                  {related.map((r) => (
                    <Link key={r.slug} href={`/game/${r.slug}`}>
                      {r.header_image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.header_image} alt="" width={92} height={43} />
                      )}
                      <span>{r.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
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
    meta: edition.toLowerCase() !== name.toLowerCase() ? edition : "Standard edition", listing: edition,
    price: x.price, free: x.is_free, currency: x.currency ?? "EUR", regular: x.regular_price, discount: x.discount_pct, url: x.store_url,
    note: x.price === null && !x.is_free ? "See the store" : undefined,
  };
}

function psOffer(g: PsGameDetail): Offer {
  const plus = g.plus_tier ? PLUS_TIER_LABEL[g.plus_tier] ?? "PS Plus" : null;
  return {
    key: `ps-${g.igdb_id}`, store: "PlayStation Store", logo: "PS", listing: g.store_name ?? g.title,
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
    key: `ns-${g.nsuid}`, store: "Nintendo eShop", logo: "NS", listing: g.title,
    meta: <>{g.title} · Digital · Spain</>,
    price: g.price, free: g.is_free, currency: g.currency ?? "EUR", regular: g.regular_price, discount: g.discount_pct, url: nintendoStoreUrl(g),
    note: g.sales_status === "preorder" ? "Pre-order" : g.sales_status === "unreleased" ? "Coming soon" : g.price === null ? "See the store" : undefined,
  };
}

function nintendoFooter(games: NintendoGameDetail[]): string {
  const g = games.find((x) => x.discount_pct && x.discount_ends_at);
  return `Prices from the Spanish eShop, checked every six hours.${g ? ` This discount ends ${longDate(g.discount_ends_at!)}.` : ""}`;
}

/** Offers, cheapest first: store · saving · price · link. */
function OfferList({ offers, empty }: { offers: Offer[]; empty: string }) {
  const sorted = [...offers].sort((a, c) => (a.price === null ? 1 : 0) - (c.price === null ? 1 : 0) || (a.price ?? 0) - (c.price ?? 0));
  if (!sorted.length) return <p className="pp-empty">{empty}</p>;
  return (
    <div className="pp-list">
      {sorted.map((o) => (
        <div key={o.key} className="pp-row">
          <div className="pp-row-main">
            <b>{o.store}</b>
            <small>{o.meta}</small>
          </div>
          <div className="pp-row-save">
            {o.discount ? <><span className="pp-pill">-{o.discount}%</span>{o.regular ? <s className="num">{money(o.regular, o.currency)}</s> : null}</> : o.note ? <span>{o.note}</span> : null}
          </div>
          <div className={`pp-row-price num${o.price === null && !o.free ? " none" : ""}`}>
            {o.free ? "Free" : o.price !== null ? money(o.price, o.currency) : "—"}
          </div>
          {o.url ? (
            <a href={o.url} target="_blank" rel={`noopener noreferrer${o.sponsored ? " sponsored" : ""}`} className="pp-go">
              {o.price === null && o.sponsored ? "Check price" : "Go to store"}
            </a>
          ) : <span />}
        </div>
      ))}
    </div>
  );
}

// ─── Pieces ──────────────────────────────────────────────────────────────────

/** One side of the price panel: the best offer of a kind, or a link / note when there's none. */
function PriceColumn({ label, offer, empty, check }: { label: string; offer: Offer | undefined; empty?: string; check?: { label: string; url: string } }) {
  return (
    <div className="pp-pcol">
      <div className="pp-plabel">{label}</div>
      {offer ? (
        <>
          <div className="pp-pvalue num">{offer.free ? "Free" : money(offer.price!, offer.currency)}</div>
          <div className="pp-pstore">{offer.store}{offer.discount ? <span className="pp-pill">-{offer.discount}%</span> : null}</div>
        </>
      ) : (
        <>
          <div className="pp-pvalue none">—</div>
          <div className="pp-pstore">
            {check ? <a href={check.url} target="_blank" rel="noopener noreferrer sponsored">{check.label}</a> : empty}
          </div>
        </>
      )}
    </div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="num" style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 12, color: "var(--text-3)" }}>{label}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
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

/** One line on how good the price is: the lowest we've seen, the discount, or a cheaper version. */
function verdict(version: Version, d: VersionData, best: Offer | undefined, low: number | null,
  data: Map<Version, VersionData>, versions: Version[]): React.ReactNode {
  const long = VERSIONS[version].long;
  if (!best || (best.price === null && !best.free)) {
    return <><b>No store lists a price for {long} right now.</b>{d.subscriptions.length ? ` It's included with ${d.subscriptions.join(" and ")}.` : ""}</>;
  }
  if (best.free) return <><b>Free to play.</b> Paid editions and bundles, if any, are listed below.</>;
  const price = best.price!;
  const stores = uniq(d.official.map((o) => o.store)).length;

  let head: string;
  if (low !== null && price <= low + 0.005) head = "Lowest price we've recorded.";
  else if (best.discount && best.discount >= 30) head = "Good deal.";
  else if (best.discount) head = "Small discount.";
  else head = stores === 1 ? "Full price at the only store selling it." : "Full price everywhere right now.";

  const parts: string[] = [];
  const steamOffer = d.official.find((o) => o.store === "Steam" && o.price !== null);
  if (version === "pc" && steamOffer && best.store !== "Steam" && steamOffer.price! > price) {
    parts.push(`${money(price, best.currency)} at ${best.store} is ${Math.round((1 - price / steamOffer.price!) * 100)}% under Steam.`);
  } else if (best.discount) {
    parts.push(`${best.discount}% off at ${best.store}.`);
  }
  if (low !== null && price > low + 0.005) parts.push(`The lowest we've recorded is ${money(low, best.currency)}.`);

  // A cheaper version of the same game in the same family (Switch vs Switch 2, PS4 vs PS5…).
  const cheaper = versions
    .filter((v) => v !== version && VERSIONS[v].family === VERSIONS[version].family)
    .map((v) => ({ v, o: cheapest(data.get(v)!.official) }))
    .filter((x) => x.o?.price !== null && x.o?.price !== undefined && x.o.price < price - 0.5)
    .sort((a, c) => a.o!.price! - c.o!.price!)[0];
  if (cheaper) parts.push(`The ${VERSIONS[cheaper.v].label} version costs ${money(cheaper.o!.price!, cheaper.o!.currency)}.`);

  return <><b>{head}</b>{parts.length ? ` ${parts.join(" ")}` : ""}</>;
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
