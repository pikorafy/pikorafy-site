import type { Metadata } from "next";
import Link from "next/link";
import { AFFILIATE_DISCLOSURE_SHORT } from "@/lib/affiliate";
import { getBestDeals, getDealCounts, getGenreTop, getPopular, getReleases, type HomeDeal, type HomeGame } from "@/lib/home";
import { igdbImage } from "@/lib/titles";
import type { Family } from "@/lib/versions";
import Image from "next/image";
import HeroCarousel, { type HeroSlide } from "@/components/HeroCarousel";
import NewsletterSignup from "@/components/NewsletterSignup";

// Home: a carousel of top deals beside a featured store, category tiles, three price lists
// (deals, just released, coming soon), the most popular games, top 5s by genre and a sign-up band. Lists read hourly summaries (lib/home.ts).
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Pikorafy — Game Price Comparison for PC, PlayStation, Xbox and Nintendo",
  description:
    "Compare game prices across Steam, the PlayStation Store, Xbox Store, Nintendo eShop and other PC stores. Each console version on its own page, with today's best deals.",
};

const FAMILY: Record<Family, { label: string; mark: string; href: string; links: { label: string; href: string }[] }> = {
  pc: { label: "PC", mark: "PC", href: "/games", links: [{ label: "Deals", href: "/games?sale=1&sort=discount" }, { label: "New releases", href: "/releases?platform=pc" }] },
  playstation: { label: "PlayStation", mark: "PS", href: "/playstation", links: [{ label: "PS5", href: "/playstation?platform=ps5" }, { label: "PS4", href: "/playstation?platform=ps4" }, { label: "PS Plus", href: "/playstation?plus=1" }] },
  xbox: { label: "Xbox", mark: "X", href: "/xbox", links: [{ label: "Series X|S", href: "/xbox?platform=series" }, { label: "Xbox One", href: "/xbox?platform=one" }, { label: "Game Pass", href: "/xbox?gamepass=1" }] },
  nintendo: { label: "Nintendo", mark: "N", href: "/nintendo", links: [{ label: "Switch 2", href: "/nintendo?platform=switch2" }, { label: "Switch", href: "/nintendo?platform=switch" }] },
};

const INSTANT_GAMING = "https://www.instant-gaming.com/?igr=pikorafy";

// Four category tiles under the hero.
interface Category { label: string; note: string; href?: string; soon?: boolean; links: { label: string; href: string; family?: Family }[] }
function categories(counts: Partial<Record<Family, number>>): Category[] {
  const onSale = (n: number | undefined) => (n ? `${n.toLocaleString("en")} on sale right now` : "Browse every game");
  const consoles = (counts.playstation ?? 0) + (counts.xbox ?? 0) + (counts.nintendo ?? 0);
  return [
    { label: "PC games", note: onSale(counts.pc), href: "/games",
      links: [{ label: "Deals", href: "/games?sale=1&sort=discount" }, { label: "Free to play", href: "/games/free-to-play" }, { label: "New releases", href: "/releases?platform=pc" }] },
    { label: "Console games", note: onSale(consoles),
      links: [{ label: "PlayStation", href: "/playstation", family: "playstation" }, { label: "Xbox", href: "/xbox", family: "xbox" }, { label: "Nintendo", href: "/nintendo", family: "nintendo" }] },
    { label: "Subscriptions", note: "Games included at no extra cost",
      links: [{ label: "Game Pass", href: "/xbox?gamepass=1", family: "xbox" }, { label: "PS Plus", href: "/playstation?plus=1", family: "playstation" }] },
    { label: "Gift cards", note: "Store credit for Steam, PlayStation, Xbox and Nintendo. Coming soon", soon: true, links: [] },
  ];
}

// Top 5s by genre (IGDB genres), each linked to its catalog page.
const GENRE_LISTS = [
  { genre: "Shooter", label: "Shooters", href: "/games/action" },
  { genre: "Role-playing (RPG)", label: "RPG", href: "/games/rpg" },
  { genre: "Adventure", label: "Adventure", href: "/games/adventure" },
  { genre: "Strategy", label: "Strategy", href: "/games/strategy" },
  { genre: "Simulator", label: "Simulation", href: "/games/simulation" },
  { genre: "Indie", label: "Indie", href: "/games/indie" },
];

const day = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);

/** Retry a list once; an empty list beats a broken page. */
async function list<T>(load: () => Promise<T[]>): Promise<T[]> {
  try { return await load(); } catch { try { return await load(); } catch { return []; } }
}

export default async function Home() {
  const today = new Date();
  const [deals, fresh, soon, popular, counts] = await Promise.all([
    list(() => getBestDeals(13)),
    list(() => getReleases(day(addDays(today, -40)), day(today), 8)),
    list(() => getReleases(day(addDays(today, 1)), day(addDays(today, 60)), 8)),
    list(() => getPopular(10)),
    getDealCounts().catch(() => ({} as Partial<Record<Family, number>>)),
  ]);
  const genreLists = await Promise.all(GENRE_LISTS.map((g) => list(() => getGenreTop(g.genre, 15))));

  // Each game once: skip the popular shelf's games and the earlier genre lists'.
  const seen = new Set(popular.map((g) => g.slug));
  const genreTops = genreLists.map((games) => games.filter((g) => !seen.has(g.slug)).slice(0, 5).map((g) => (seen.add(g.slug), g)));

  // Carousel: the top deals that have art, most popular first; the lists get the rest.
  const slides = deals.filter((d) => d.art_id).slice(0, 5);
  const rest = deals.filter((d) => !slides.includes(d)).slice(0, 8);

  return (
    <div className="hm">
      <div className="shell hm-top">
        <div className="hm-hero">
          <HeroCarousel slides={slides.map(toSlide)} />
          <FeaturedStore />
        </div>

        <nav className="hm-cats" aria-label="Categories">
          {categories(counts).map((c) => (
            <div key={c.label} className={`hm-cat${c.soon ? " soon" : ""}`}>
              {c.href ? <Link href={c.href} className="hm-cat-h">{c.label}</Link> : <span className="hm-cat-h">{c.label}</span>}
              <small>{c.note}</small>
              {c.links.length > 0 && (
                <div className="hm-cat-links">
                  {c.links.map((l) => (
                    <Link key={l.href} href={l.href} className={l.family ? `pf-${l.family}` : undefined}>
                      {l.family && <i aria-hidden />}{l.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      <main className="shell hm-main">
        <section className="hm-block hm-lists">
          <HomeList title="Best deals now" more={{ label: "All deals", href: "/games?sale=1&sort=discount" }}>
            {rest.map((d) => (
              <Row key={d.slug} game={d} sub={d.store} right={<><span className="hm-price num">{money(d.price)}</span><span className="hm-pill">-{d.discount_pct}%</span></>} />
            ))}
          </HomeList>
          <HomeList title="Just released" more={{ label: "Releases", href: "/releases" }}>
            {fresh.map((g) => <Row key={g.slug} game={g} sub={g.released ? shortDate(g.released) : ""} right={<FromPrice price={g.from_price} />} />)}
          </HomeList>
          <HomeList title="Coming soon" more={{ label: "Calendar", href: "/releases" }}>
            {soon.map((g) => <Row key={g.slug} game={g} sub={g.released ? shortDate(g.released) : ""} right={<FromPrice price={g.from_price} />} />)}
          </HomeList>
        </section>

        {popular.length > 0 && (
          <section className="hm-block" aria-labelledby="hm-popular">
            <div className="hm-block-h"><h2 id="hm-popular">Most popular right now</h2><Link href="/games">See more →</Link></div>
            <div className="hm-shelf">
              {popular.map((g) => (
                <Link key={g.slug} href={`/game/${g.slug}`} className="hm-card">
                  <Cover id={g.cover_id} name={g.name} size="t_cover_big" />
                  <b>{g.name}</b>
                  <span className="hm-card-foot">
                    <Marks families={g.families} />
                    {g.from_price === 0 ? <span className="hm-price">Free</span>
                      : g.from_price !== null ? <span><span className="hm-from">from</span><span className="hm-price num">{money(g.from_price)}</span></span> : null}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {genreTops.some((g) => g.length) && (
          <section className="hm-block" aria-labelledby="hm-genres">
            <div className="hm-block-h"><h2 id="hm-genres">Top 5 by genre</h2></div>
            <div className="hm-genres">
              {GENRE_LISTS.map((g, i) => genreTops[i].length > 0 && (
                <HomeList key={g.genre} title={g.label} more={{ label: "All", href: g.href }}>
                  {genreTops[i].map((game, rank) => (
                    <Row key={game.slug} game={game} rank={rank + 1} sub="" right={<FromPrice price={game.from_price} />} />
                  ))}
                </HomeList>
              ))}
            </div>
          </section>
        )}
      </main>

      <section className="hm-band">
        <div className="shell hm-band-grid">
          <div>
            <h2>The week&apos;s best deals, once a week</h2>
            <p>One email every Friday with the biggest price drops on PC, PlayStation, Xbox and Nintendo. No spam; unsubscribe any time.</p>
            <NewsletterSignup />
          </div>
          <div className="hm-how">
            <div><span>1</span><p><b>Official stores first</b>Steam, PlayStation, Xbox and Nintendo prices, straight from the stores.</p></div>
            <div><span>2</span><p><b>Keyshops kept apart</b>Resellers are listed separately from official stores.</p></div>
            <div><span>3</span><p><b>Each version on its own page</b>PS5 and PS4, Switch 2 and Switch: the prices you can actually buy at.</p></div>
          </div>
        </div>
      </section>
      <p className="shell hm-disclose">{AFFILIATE_DISCLOSURE_SHORT}</p>
    </div>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function toSlide(d: HomeDeal): HeroSlide {
  return {
    slug: d.slug,
    name: d.name,
    art: d.art_id ? igdbImage(d.art_id, "t_1080p") : null,
    cover: d.cover_id ? igdbImage(d.cover_id, "t_cover_big_2x") : null,
    genres: d.genres,
    platforms: d.families.map((f) => ({ key: f, label: FAMILY[f].label })),
    price: money(d.price),
    regular: d.regular_price ? money(d.regular_price) : null,
    discount: d.discount_pct,
    store: d.family === "pc" ? d.store : `${d.store} (${FAMILY[d.family].label})`,
  };
}

/** The hero's third: one partner store. Instant Gaming for now; later the paid featured-store spot. */
function FeaturedStore() {
  return (
    <a href={INSTANT_GAMING} target="_blank" rel="noopener noreferrer sponsored" className="hm-store">
      <span className="hm-store-tag">Featured store · partner</span>
      <Image src="/partners/instant-gaming/logo.png" alt="" width={56} height={56} className="hm-store-logo" />
      <b>Instant Gaming</b>
      <p>Game keys for PC, PlayStation, Xbox and Nintendo, often below the official stores&apos; price.</p>
      <span className="pp-btn pp-btn-ghost">Browse their deals ↗</span>
      <small>Sponsored link. It never changes the order of the offers on game pages.</small>
    </a>
  );
}

// ─── Pieces ──────────────────────────────────────────────────────────────────

function HomeList({ title, more, children }: { title: string; more: { label: string; href: string }; children: React.ReactNode[] }) {
  return (
    <div className="hm-list">
      <div className="hm-list-h"><h3>{title}</h3><Link href={more.href}>{more.label} →</Link></div>
      {children.length ? children : <p className="hm-empty">Nothing here right now.</p>}
    </div>
  );
}

function Row({ game, sub, right, rank }: { game: HomeGame | HomeDeal; sub: string; right: React.ReactNode; rank?: number }) {
  return (
    <Link href={`/game/${game.slug}`} className={`hm-row${rank ? " ranked" : ""}`}>
      {rank && <span className="hm-rank num">{rank}</span>}
      <Cover id={game.cover_id} name={game.name} size="t_cover_small" className="hm-thumb" />
      <span className="hm-row-main"><b>{game.name}</b><small><Marks families={game.families} />{sub}</small></span>
      <span className="hm-row-right">{right}</span>
    </Link>
  );
}

function FromPrice({ price }: { price: number | null }) {
  if (price === null) return <span className="hm-muted">—</span>;
  if (price === 0) return <span className="hm-price">Free</span>;
  return <span className="hm-price num">{money(price)}</span>;
}

function Marks({ families }: { families: Family[] }) {
  return (
    <span className="hm-marks" aria-label={families.map((f) => FAMILY[f].label).join(", ")}>
      {families.map((f) => <i key={f} className={`pf-${f}`} />)}
    </span>
  );
}

function Cover({ id, name, size, className = "hm-cover" }: { id: string | null; name: string; size: string; className?: string }) {
  return (
    <span className={className}>
      {id
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={igdbImage(id, size)} alt="" loading="lazy" />
        : <span className="hm-cover-empty">{name}</span>}
    </span>
  );
}

function money(n: number) {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(n);
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}
