import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  cleanXboxTitle,
  getRelatedXbox,
  getSubscriptionNames,
  getXboxBySlug,
  getXboxEditions,
  subscriptionLabels,
  xboxHref,
  type XboxGameDetail,
} from "@/lib/xbox";
import XboxOffers, { xboxPlatforms } from "@/components/XboxOffers";
import { LOW_TONE, priceTone } from "@/lib/price-tone";
import GameMedia from "@/app/game/[slug]/GameMedia";

// Xbox Store product pages for games we don't have on Steam. Games that exist on
// both redirect to the merged /game/[slug] page, which shows both sets of prices.
// Rendered on first visit, refreshed at most hourly (prices update every 6h).
export const revalidate = 3600;

const BASE_URL = "https://pikorafy.com";

interface XboxPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: XboxPageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = await getXboxBySlug(slug);
  if (!game || game.game_slug || !game.is_primary) return {};
  const title = cleanXboxTitle(game.title);

  const description =
    `${title} is ${priceText(game) ?? "listed"} on the Xbox Store right now. ` +
    `See the current price, discounts, platforms, trailers and screenshots.`;
  const image = game.hero_art ?? game.box_art;
  const images = image ? [{ url: `${image}?w=1200` }] : undefined;

  return {
    // The root layout's title template appends " | Pikorafy".
    title: `${title}: Xbox Price & Deals`,
    description,
    alternates: { canonical: `/xbox/${game.slug}` },
    // Same rule as the Steam pages: price-only pages stay out of the index for now.
    robots: { index: false, follow: true },
    openGraph: { title: `${title} — Xbox price today`, description, url: `${BASE_URL}/xbox/${game.slug}`, images },
    twitter: { title: `${title} — Xbox price today`, description, images },
  };
}

export default async function XboxGamePage({ params }: XboxPageProps) {
  const { slug } = await params;
  const game = await getXboxBySlug(slug);
  if (!game) notFound();
  if (game.game_slug) redirect(`/game/${game.game_slug}`);

  const [editions, related, subNames] = await Promise.all([
    game.group_key ? getXboxEditions(game.group_key) : Promise.resolve([game]),
    getRelatedXbox(game, 6),
    getSubscriptionNames(),
  ]);
  // Other editions / platform versions live on their group's primary page.
  const primary = editions.find((e) => e.is_primary);
  if (!game.is_primary && primary && primary.slug !== game.slug) redirect(`/xbox/${primary.slug}`);

  const title = cleanXboxTitle(game.title);
  const included = subscriptionLabels(editions, subNames);
  const cur = game.currency ?? "EUR";
  const platforms = xboxPlatforms(editions, true);
  const onSale = (game.discount_pct ?? 0) > 0;
  const storeUrl = game.store_url ?? `https://www.xbox.com/es-ES/games/store/${game.slug}/${game.product_id}`;

  const screenshots = game.screenshots.map((url) => ({ thumb: `${url}?w=400`, full: `${url}?w=1920` }));
  const trailers = game.trailers.map((t, i) => {
    const thumb = t.thumb ?? game.hero_art ?? game.box_art ?? "";
    return { id: i + 1, name: t.name, hls: t.hls, thumb: thumb ? `${thumb}?w=1280` : "" };
  });

  return (
    <>
      <script
        type="application/ld+json"
        // JSON-LD must be inline; escape "<" so names can't close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(game, title, storeUrl, platforms)).replace(/</g, "\\u003c") }}
      />

      {/* ─── Hero: media on the left, title / price / buy on the right ── */}
      <section className="detail-hero media-hero">
        {game.hero_art && (
          <div className="bg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${game.hero_art}?w=1920`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
        <div className="scrim" />
        <div className="shell inner">
          <div>
            <GameMedia
              name={title}
              source={{ label: "Xbox", url: storeUrl }}
              keyArt={game.key_art}
              trailers={trailers}
              screenshots={screenshots}
              inHero
            />
          </div>
          <div className="hero-info">
            <div className="crumbs">
              <Link href="/">Home</Link> / <Link href="/xbox">Xbox</Link> / <span style={{ color: "var(--text)" }}>{title}</span>
            </div>
            <h1>{title}</h1>
            <p className="tagline">{heroLine(game, title, editions.filter((e) => e.price !== null).length)}</p>
            {/* Prices first; rating on its own line below. No price history for Xbox yet,
                so the pill colour follows the discount: full price reads red. */}
            <div className="stats stats-prices">
              {game.price !== null && (
                <Stat
                  value={game.is_free ? "Free" : money(game.price, cur)}
                  label="Xbox Store price"
                  pill={game.is_free ? LOW_TONE : priceTone(game.price, null, game.regular_price, game.discount_pct)}
                />
              )}
              {onSale && <Stat value={`-${game.discount_pct}%`} label="Discount" accent />}
              {onSale && game.regular_price !== null && <Stat value={money(game.regular_price, cur)} label="Regular price" />}
            </div>
            {game.rating !== null && (game.rating_count ?? 0) > 0 && (
              <div className="stats stats-meta">
                <Stat value={`★ ${game.rating.toFixed(1)}`} label={`${compact(game.rating_count!)} ratings`} />
              </div>
            )}
            <div className="hero-buttons">
              <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                {game.is_free ? "Play free on Xbox" : game.price !== null ? `Buy on Xbox Store for ${money(game.price, cur)}` : "View on Xbox Store"} →
              </a>
            </div>
            {game.short_description && (
              <figure style={{ margin: "22px 0 0" }}>
                <blockquote style={{ margin: 0, color: "var(--text-2)", fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-line" }}>
                  {game.short_description}
                </blockquote>
                <figcaption style={{ fontFamily: "var(--ff-mono)", fontSize: 10, color: "var(--text-3)", marginTop: 8, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  From the{" "}
                  <a href={storeUrl} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>
                    Xbox Store page
                  </a>
                </figcaption>
              </figure>
            )}
            <div className="tag-row" style={{ marginTop: 18 }}>
              {[...game.categories, ...platforms].map((tag) => <span key={tag} className="t">{tag}</span>)}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Detail grid ──────────────────────────────────────────────── */}
      <div className="shell detail-grid">
        <div>
          <XboxOffers name={title} products={editions} included={included} first />
        </div>

        {/* Aside */}
        <aside style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="aside-card">
            <h4>Game info</h4>
            <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 16px", margin: 0, fontSize: 13 }}>
              <InfoRow label="Developer" value={game.developer ?? ""} />
              <InfoRow label="Publisher" value={game.publisher ?? ""} />
              <InfoRow label="Released" value={game.release_date ? longDate(game.release_date) : ""} />
              <InfoRow label="Rating" value={game.rating !== null && game.rating_count ? `${game.rating.toFixed(1)} / 5 (${compact(game.rating_count)})` : ""} />
              <InfoRow label="Platforms" value={platforms.join(", ")} />
              <InfoRow label="Category" value={game.categories.join(", ")} />
            </dl>
            <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ justifyContent: "center", width: "100%", marginTop: 16 }}>
              View on Xbox Store →
            </a>
          </div>

          {related.length > 0 && (
            <div className="aside-card">
              <h4>Popular {game.categories[0]} games on Xbox</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {related.map((r) => {
                  const img = r.hero_art ?? r.box_art;
                  return (
                    <Link key={r.product_id} href={xboxHref(r)} style={{ display: "flex", gap: 12, alignItems: "center", textDecoration: "none", color: "inherit" }}>
                      {img && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`${img}?w=184`} alt="" width={92} height={52} style={{ borderRadius: 3, objectFit: "cover", flexShrink: 0 }} />
                      )}
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{r.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

// ─── Pieces ──────────────────────────────────────────────────────────────────

function Stat({ value, label, accent, pill }: { value: string; label: string; accent?: boolean; pill?: string }) {
  return (
    <div>
      <div className="v" style={accent ? { color: "var(--accent)" } : undefined}>
        {pill ? <span className="price-pill" style={{ background: pill }}>{value}</span> : value}
      </div>
      <div className="l">{label}</div>
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

// ─── Copy built from facts ───────────────────────────────────────────────────

function priceText(game: XboxGameDetail): string | null {
  if (game.is_free) return "free to play";
  if (game.price === null) return null;
  return `${money(game.price, game.currency ?? "EUR")}${game.discount_pct ? ` (-${game.discount_pct}%)` : ""}`;
}

function heroLine(game: XboxGameDetail, title: string, editionCount: number): string {
  if (game.is_free) return `${title} is free to play on Xbox.`;
  if (game.price === null) return `${title} has no standalone price on the Spanish Xbox Store right now.`;
  const cur = game.currency ?? "EUR";
  const editions = editionCount > 1 ? ` ${editionCount} editions listed below.` : "";
  if (game.discount_pct && game.regular_price !== null) {
    return `${money(game.price, cur)} on the Xbox Store, ${game.discount_pct}% off the regular ${money(game.regular_price, cur)}.${editions}`;
  }
  return `${money(game.price, cur)} on the Xbox Store. It's at full price right now.${editions}`;
}

function jsonLd(game: XboxGameDetail, title: string, storeUrl: string, platforms: string[]) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: title,
    url: `${BASE_URL}/xbox/${game.slug}`,
    image: game.box_art ?? game.hero_art ?? undefined,
    genre: game.categories,
    author: game.developer ? { "@type": "Organization", name: game.developer } : undefined,
    publisher: game.publisher ? { "@type": "Organization", name: game.publisher } : undefined,
    datePublished: game.release_date ?? undefined,
    gamePlatform: platforms,
    offers: game.price !== null
      ? {
          "@type": "Offer",
          price: game.price.toFixed(2),
          priceCurrency: game.currency ?? "EUR",
          url: storeUrl,
          availability: "https://schema.org/InStock",
          seller: { "@type": "Organization", name: "Microsoft Store" },
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
