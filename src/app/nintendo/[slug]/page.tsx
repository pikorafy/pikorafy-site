import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getNintendoBySlug,
  getRelatedNintendo,
  nintendoPlatformLabel,
  nintendoStoreUrl,
  type NintendoGameDetail,
} from "@/lib/nintendo";
import { LOW_TONE, priceTone } from "@/lib/price-tone";
import { MetaStat, MetaStats, PriceTile, PriceTiles } from "@/components/HeroStats";
import GameMedia from "@/app/game/[slug]/GameMedia";
import FallbackImg from "@/components/FallbackImg";

// Nintendo eShop product pages (Switch / Switch 2). Rendered on first visit,
// refreshed at most hourly (prices update every 6h).
export const revalidate = 3600;

const BASE_URL = "https://pikorafy.com";

interface NintendoPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: NintendoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = await getNintendoBySlug(slug);
  if (!game) return {};
  const description =
    `${game.title} is ${priceText(game) ?? "listed"} on the Nintendo eShop right now. ` +
    `See the current price, discounts and when the sale ends.`;
  const image = game.image_wide ?? game.image_page ?? game.image_square;
  const images = image ? [{ url: image }] : undefined;
  return {
    // The root layout's title template appends " | Pikorafy".
    title: `${game.title}: Nintendo Switch Price & Deals`,
    description,
    alternates: { canonical: `/nintendo/${game.slug}` },
    // Same rule as the Steam and Xbox pages: price-only pages stay out of the index for now.
    robots: { index: false, follow: true },
    openGraph: { title: `${game.title} — eShop price today`, description, url: `${BASE_URL}/nintendo/${game.slug}`, images },
    twitter: { title: `${game.title} — eShop price today`, description, images },
  };
}

export default async function NintendoGamePage({ params }: NintendoPageProps) {
  const { slug } = await params;
  const game = await getNintendoBySlug(slug);
  if (!game) notFound();

  const related = await getRelatedNintendo(game, 6);
  const cur = game.currency ?? "EUR";
  const onSale = (game.discount_pct ?? 0) > 0;
  const storeUrl = nintendoStoreUrl(game);
  const platforms = game.platforms.map(nintendoPlatformLabel);
  const status = game.sales_status === "preorder" ? "Pre-order" : game.sales_status === "unreleased" ? "Coming soon" : null;

  return (
    <>
      <script
        type="application/ld+json"
        // JSON-LD must be inline; escape "<" so names can't close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(game, storeUrl, platforms)).replace(/</g, "\\u003c") }}
      />

      {/* ─── Hero: key art on the left, title / price / buy on the right ── */}
      <section className="detail-hero media-hero">
        {game.key_art && (
          <div className="bg">
            <FallbackImg srcs={[game.key_art.src, ...game.key_art.fallbacks]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
        <div className="scrim" />
        <div className="shell inner">
          <div>
            {game.key_art && (
              <GameMedia
                name={game.title}
                source={{ label: "Nintendo", url: storeUrl ?? "https://www.nintendo.com" }}
                keyArt={game.key_art}
                trailers={[]}
                screenshots={[]}
                inHero
              />
            )}
          </div>
          <div className="hero-info">
            <div className="crumbs">
              <Link href="/">Home</Link> / <Link href="/nintendo">Nintendo</Link> / <span style={{ color: "var(--text)" }}>{game.title}</span>
            </div>
            <h1>{game.title}</h1>
            <p className="tagline">{heroLine(game)}</p>
            {/* No eShop price history yet, so the tile colour follows the discount: full price reads red. */}
            {(game.price !== null || game.is_free) && (
              <PriceTiles>
                <PriceTile
                  label="eShop price"
                  value={game.is_free ? "Free" : money(game.price!, cur)}
                  tone={game.is_free ? LOW_TONE : priceTone(game.price!, null, game.regular_price, game.discount_pct)}
                  badge={onSale ? `-${game.discount_pct}%` : undefined}
                />
                {onSale && game.regular_price !== null && <PriceTile label="Regular price" value={money(game.regular_price, cur)} />}
              </PriceTiles>
            )}
            {(onSale && game.discount_ends_at) || game.release_date || status ? (
              <MetaStats>
                {onSale && game.discount_ends_at && <MetaStat value={shortDate(game.discount_ends_at)} label="Sale ends" />}
                {game.release_date && <MetaStat value={shortDate(game.release_date)} label={status ? "Release date" : "Released"} />}
                {status && <MetaStat value={status} label="Status" />}
              </MetaStats>
            ) : null}
            {storeUrl && (
              <div className="hero-buttons">
                <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  {game.is_free ? "Play free on Switch" : game.price !== null ? `View on the eShop · ${money(game.price, cur)}` : "View on Nintendo.com"} →
                </a>
              </div>
            )}
            {game.excerpt && (
              <figure style={{ margin: "22px 0 0" }}>
                <blockquote style={{ margin: 0, color: "var(--text-2)", fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-line" }}>
                  {game.excerpt}
                </blockquote>
                <figcaption style={{ fontFamily: "var(--ff-mono)", fontSize: 10, color: "var(--text-3)", marginTop: 8, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  From the Nintendo eShop
                </figcaption>
              </figure>
            )}
            <div className="tag-row" style={{ marginTop: 18 }}>
              {[...game.genres, ...platforms].map((tag) => <span key={tag} className="t">{tag}</span>)}
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
                <div className="store-logo">NS</div>
                <div>
                  <div className="sname">Nintendo eShop</div>
                  <div className="smeta"><span className="plat">{platforms.join(" / ")}</span> · Digital · Spain</div>
                </div>
              </div>
              <div className="price-cell">
                <div className="pp">{game.is_free ? "Free" : game.price !== null ? money(game.price, cur) : "—"}</div>
                <div className="pf">{status ?? (game.price === null ? "See the store" : "Official store")}</div>
              </div>
              <div className="price-cell"><div className="pf" style={{ fontSize: 13 }}>{game.regular_price ? money(game.regular_price, cur) : "—"}</div></div>
              <div className="price-cell"><div className="pf" style={{ fontSize: 13 }}>{onSale ? `-${game.discount_pct}%` : "—"}</div></div>
              {storeUrl ? (
                <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="gobtn" style={{ textDecoration: "none", textAlign: "center" }}>Get →</a>
              ) : <div />}
            </div>
          </div>
          <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: 10 }}>
            Price from the Spanish eShop, checked every six hours.
            {onSale && game.discount_ends_at ? ` This discount ends ${longDate(game.discount_ends_at)}.` : ""}
          </p>
        </div>

        <aside style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="aside-card">
            <h4>Game info</h4>
            <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 16px", margin: 0, fontSize: 13 }}>
              <InfoRow label="Developer" value={game.developer ?? ""} />
              <InfoRow label="Publisher" value={game.publisher ?? ""} />
              <InfoRow label="Released" value={game.release_date ? longDate(game.release_date) : ""} />
              <InfoRow label="Platforms" value={platforms.join(", ")} />
              <InfoRow label="Genre" value={game.genres.join(", ")} />
            </dl>
            {storeUrl && (
              <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ justifyContent: "center", width: "100%", marginTop: 16 }}>
                View on Nintendo.com →
              </a>
            )}
          </div>

          {related.length > 0 && (
            <div className="aside-card">
              <h4>Popular {game.genres[0]} games on Switch</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {related.map((r) => (
                  <Link key={r.nsuid} href={`/nintendo/${r.slug}`} style={{ display: "flex", gap: 12, alignItems: "center", textDecoration: "none", color: "inherit" }}>
                    <FallbackImg srcs={r.wide_art} last={r.image_square} alt="" width={92} height={46}
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

function priceText(game: NintendoGameDetail): string | null {
  if (game.is_free) return "free to play";
  if (game.price === null) return null;
  return `${money(game.price, game.currency ?? "EUR")}${game.discount_pct ? ` (-${game.discount_pct}%)` : ""}`;
}

function heroLine(game: NintendoGameDetail): string {
  const cur = game.currency ?? "EUR";
  if (game.is_free) return `${game.title} is free to play on Nintendo Switch.`;
  if (game.sales_status === "unreleased") return `${game.title} isn't out yet${game.release_date ? ` — it's due ${longDate(game.release_date)}` : ""}.`;
  if (game.price === null) return `${game.title} has no price on the Spanish eShop right now.`;
  if (game.discount_pct && game.regular_price !== null) {
    const ends = game.discount_ends_at ? ` until ${longDate(game.discount_ends_at)}` : "";
    return `${money(game.price, cur)} on the eShop, ${game.discount_pct}% off the regular ${money(game.regular_price, cur)}${ends}.`;
  }
  const pre = game.sales_status === "preorder" ? " to pre-order" : "";
  return `${money(game.price, cur)} on the eShop${pre}. It's at full price right now.`;
}

function jsonLd(game: NintendoGameDetail, storeUrl: string | null, platforms: string[]) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.title,
    url: `${BASE_URL}/nintendo/${game.slug}`,
    image: game.image_wide ?? game.image_page ?? game.image_square ?? undefined,
    genre: game.genres,
    author: game.developer ? { "@type": "Organization", name: game.developer } : undefined,
    publisher: game.publisher ? { "@type": "Organization", name: game.publisher } : undefined,
    datePublished: game.release_date ?? undefined,
    gamePlatform: platforms,
    offers: game.price !== null && storeUrl
      ? {
          "@type": "Offer",
          price: game.price.toFixed(2),
          priceCurrency: game.currency ?? "EUR",
          url: storeUrl,
          availability: game.sales_status === "preorder" ? "https://schema.org/PreOrder" : "https://schema.org/InStock",
          seller: { "@type": "Organization", name: "Nintendo eShop" },
        }
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
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
