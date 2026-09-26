import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPsBySlug, getRelatedPs, PLUS_TIER_LABEL, psStoreUrl, type PsGameDetail } from "@/lib/playstation";
import { LOW_TONE, priceTone } from "@/lib/price-tone";
import { MetaStat, MetaStats, PriceTile, PriceTiles } from "@/components/HeroStats";
import GameMedia from "@/app/game/[slug]/GameMedia";
import FallbackImg from "@/components/FallbackImg";

// PlayStation Store product pages (PS5 / PS4). Rendered on first visit, refreshed at
// most hourly (popular games' store data updates daily, the rest every few days).
export const revalidate = 3600;

const BASE_URL = "https://pikorafy.com";

interface PsPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = await getPsBySlug(slug);
  if (!game) return {};
  const description =
    `${game.title} is ${priceText(game) ?? "listed"} on the PlayStation Store right now. ` +
    `See the current price, discounts, PS Plus and when the sale ends.`;
  const image = game.image_wide ?? game.image_hero ?? game.image_square;
  const images = image ? [{ url: image }] : undefined;
  return {
    // The root layout's title template appends " | Pikorafy".
    title: `${game.title}: PS5 & PS4 Price & Deals`,
    description,
    alternates: { canonical: `/playstation/${game.slug}` },
    // Same rule as the Steam, Xbox and Nintendo pages: price-only pages stay out of the index for now.
    robots: { index: false, follow: true },
    openGraph: { title: `${game.title} — PlayStation Store price today`, description, url: `${BASE_URL}/playstation/${game.slug}`, images },
    twitter: { title: `${game.title} — PlayStation Store price today`, description, images },
  };
}

export default async function PsGamePage({ params }: PsPageProps) {
  const { slug } = await params;
  const game = await getPsBySlug(slug);
  if (!game) notFound();

  const related = await getRelatedPs(game, 6);
  const cur = game.currency ?? "EUR";
  const onSale = (game.discount_pct ?? 0) > 0;
  const storeUrl = psStoreUrl(game);
  const plusLabel = game.plus_tier ? PLUS_TIER_LABEL[game.plus_tier] ?? "PS Plus" : null;
  const status = game.sales_status === "preorder" ? "Pre-order" : null;
  const hero = game.image_hero ?? game.image_wide;

  return (
    <>
      <script
        type="application/ld+json"
        // JSON-LD must be inline; escape "<" so names can't close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(game, storeUrl)).replace(/</g, "\\u003c") }}
      />

      {/* ─── Hero: key art on the left, title / price / buy on the right ── */}
      <section className="detail-hero media-hero">
        {hero && (
          <div className="bg">
            <FallbackImg srcs={[hero]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
        <div className="scrim" />
        <div className="shell inner">
          <div>
            {game.key_art && (
              <GameMedia
                name={game.title}
                source={{ label: "PlayStation Store", url: storeUrl }}
                keyArt={game.key_art}
                trailers={[]}
                screenshots={game.screenshots}
                inHero
              />
            )}
          </div>
          <div className="hero-info">
            <div className="crumbs">
              <Link href="/">Home</Link> / <Link href="/playstation">PlayStation</Link> / <span style={{ color: "var(--text)" }}>{game.title}</span>
            </div>
            <h1>{game.title}</h1>
            <p className="tagline">{heroLine(game)}</p>
            {(game.price !== null || game.is_free || plusLabel) && (
              <PriceTiles>
                {(game.price !== null || game.is_free) && (
                  <PriceTile
                    label="PS Store price"
                    value={game.is_free ? "Free" : money(game.price!, cur)}
                    tone={game.is_free ? LOW_TONE : priceTone(game.price!, game.lowest_30d, game.regular_price, game.discount_pct)}
                    badge={onSale ? `-${game.discount_pct}%` : undefined}
                  />
                )}
                {game.plus_price !== null && <PriceTile label="PS Plus price" value={money(game.plus_price, cur)} />}
                {plusLabel && <PriceTile label="PS Plus" value={`In ${plusLabel.replace("PS Plus ", "")}`} tone={LOW_TONE} />}
                {onSale && game.regular_price !== null && <PriceTile label="Regular price" value={money(game.regular_price, cur)} />}
              </PriceTiles>
            )}
            <MetaStats>
              {onSale && game.discount_ends_at && <MetaStat value={shortDate(game.discount_ends_at)} label="Sale ends" />}
              {game.lowest_30d !== null && <MetaStat value={money(game.lowest_30d, cur)} label="Lowest in 30 days" />}
              {game.star_rating !== null && (
                <MetaStat value={`${game.star_rating.toFixed(1)}★`} label={game.rating_count ? `${compact(game.rating_count)} ratings` : "Rating"} />
              )}
              {game.release_date && <MetaStat value={shortDate(game.release_date)} label={status ? "Release date" : "Released"} />}
            </MetaStats>
            <div className="hero-buttons">
              <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                {game.is_free ? "Play free on PlayStation" : game.price !== null ? `View on the PS Store · ${money(game.price, cur)}` : "View on the PS Store"} →
              </a>
              {game.steam_slug && (
                <Link href={`/game/${game.steam_slug}`} className="btn btn-ghost">Also on PC: compare prices →</Link>
              )}
            </div>
            {game.summary && (
              <figure style={{ margin: "22px 0 0" }}>
                <blockquote style={{ margin: 0, color: "var(--text-2)", fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-line" }}>
                  {game.summary}
                </blockquote>
                <figcaption style={{ fontFamily: "var(--ff-mono)", fontSize: 10, color: "var(--text-3)", marginTop: 8, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  Summary from IGDB
                </figcaption>
              </figure>
            )}
            <div className="tag-row" style={{ marginTop: 18 }}>
              {[...game.genres, ...game.platforms].map((tag) => <span key={tag} className="t">{tag}</span>)}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Detail grid ──────────────────────────────────────────────── */}
      <div className="shell detail-grid">
        <div>
          <div className="section-hd" style={{ marginBottom: 16 }}>
            <div>
              <div className="eyebrow">Current offers · prices in {cur}</div>
              <h2 className="h2" style={{ fontSize: "clamp(24px,4vw,32px)" }}>Where to buy {game.title}</h2>
            </div>
          </div>
          <div className="offers">
            <div className="hd">
              <div>#</div>
              <div>Store</div>
              <div>Price</div>
              <div>Regular price</div>
              <div>Discount</div>
              <div />
            </div>
            <div className={`row ${game.price !== null ? "cheapest" : ""}`}>
              <div className="rank">01</div>
              <div className="store-block">
                <div className="store-logo">PS</div>
                <div>
                  <div className="sname">PlayStation Store</div>
                  <div className="smeta"><span className="plat">{game.platforms.join(" / ")}</span> · Digital · Spain</div>
                </div>
              </div>
              <div className="price-cell">
                <div className="pp">{game.is_free ? "Free" : game.price !== null ? money(game.price, cur) : "—"}</div>
                <div className="pf">{status ?? (game.price === null ? (plusLabel ? `In ${plusLabel}` : "See the store") : "Official store")}</div>
              </div>
              <div className="price-cell"><div className="pf" style={{ fontSize: 13 }}>{game.regular_price ? money(game.regular_price, cur) : "—"}</div></div>
              <div className="price-cell"><div className="pf" style={{ fontSize: 13 }}>{onSale ? `-${game.discount_pct}%` : "—"}</div></div>
              <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="gobtn" style={{ textDecoration: "none", textAlign: "center" }}>Get →</a>
            </div>
          </div>
          <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: 10 }}>
            Price from the Spanish PlayStation Store{game.store_name && game.store_name !== game.title ? ` (${game.store_name})` : ""}.
            {onSale && game.discount_ends_at ? ` This discount ends ${longDate(game.discount_ends_at)}.` : ""}
            {plusLabel ? ` Included at no extra cost with ${plusLabel}.` : ""}
            {game.plus_price !== null ? ` PS Plus members pay ${money(game.plus_price, cur)}.` : ""}
          </p>
        </div>

        <aside style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="aside-card">
            <h4>Game info</h4>
            <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 16px", margin: 0, fontSize: 13 }}>
              <InfoRow label="Publisher" value={game.publisher ?? ""} />
              <InfoRow label="Released" value={game.release_date ? longDate(game.release_date) : ""} />
              <InfoRow label="Platforms" value={game.platforms.join(", ")} />
              <InfoRow label="Genre" value={game.genres.join(", ")} />
              <InfoRow label="PS Plus" value={plusLabel ?? ""} />
            </dl>
            <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ justifyContent: "center", width: "100%", marginTop: 16 }}>
              View on the PlayStation Store →
            </a>
          </div>

          {related.length > 0 && (
            <div className="aside-card">
              <h4>Popular {game.genres[0]} games on PlayStation</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {related.map((r) => (
                  <Link key={r.igdb_id} href={`/playstation/${r.slug}`} style={{ display: "flex", gap: 12, alignItems: "center", textDecoration: "none", color: "inherit" }}>
                    <FallbackImg srcs={r.image_wide ? [r.image_wide] : []} last={r.image_square} alt="" width={92} height={46}
                      style={{ width: 92, height: 46, borderRadius: 3, objectFit: "cover", flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{r.title}</span>
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

function InfoRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <>
      <dt style={{ color: "var(--text-3)" }}>{label}</dt>
      <dd style={{ margin: 0 }}>{value}</dd>
    </>
  );
}

// ─── Copy built from facts ───────────────────────────────────────────────────

function priceText(game: PsGameDetail): string | null {
  if (game.is_free) return "free to play";
  if (game.price === null) return game.plus_tier ? `included with ${PLUS_TIER_LABEL[game.plus_tier] ?? "PS Plus"}` : null;
  return `${money(game.price, game.currency ?? "EUR")}${game.discount_pct ? ` (-${game.discount_pct}%)` : ""}`;
}

function heroLine(game: PsGameDetail): string {
  const cur = game.currency ?? "EUR";
  const plus = game.plus_tier ? ` It's also included with ${PLUS_TIER_LABEL[game.plus_tier] ?? "PS Plus"}.` : "";
  if (game.is_free) return `${game.title} is free to play on PlayStation.`;
  if (game.price === null) {
    return game.plus_tier ? `${game.title} is included with ${PLUS_TIER_LABEL[game.plus_tier] ?? "PS Plus"}.` : `${game.title} has no price on the Spanish PlayStation Store right now.`;
  }
  if (game.discount_pct && game.regular_price !== null) {
    const ends = game.discount_ends_at ? ` until ${longDate(game.discount_ends_at)}` : "";
    return `${money(game.price, cur)} on the PlayStation Store, ${game.discount_pct}% off the regular ${money(game.regular_price, cur)}${ends}.${plus}`;
  }
  const pre = game.sales_status === "preorder" ? " to pre-order" : "";
  return `${money(game.price, cur)} on the PlayStation Store${pre}. It's at full price right now.${plus}`;
}

function jsonLd(game: PsGameDetail, storeUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.title,
    url: `${BASE_URL}/playstation/${game.slug}`,
    image: game.image_wide ?? game.image_hero ?? game.image_square ?? undefined,
    genre: game.genres,
    publisher: game.publisher ? { "@type": "Organization", name: game.publisher } : undefined,
    datePublished: game.release_date ?? undefined,
    gamePlatform: game.platforms,
    offers: game.price !== null
      ? {
          "@type": "Offer",
          price: game.price.toFixed(2),
          priceCurrency: game.currency ?? "EUR",
          url: storeUrl,
          availability: game.sales_status === "preorder" ? "https://schema.org/PreOrder" : "https://schema.org/InStock",
          seller: { "@type": "Organization", name: "PlayStation Store" },
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
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
