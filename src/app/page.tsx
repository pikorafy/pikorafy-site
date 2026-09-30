import type { Metadata } from "next";
import Link from "next/link";
import { AFFILIATE_DISCLOSURE_SHORT } from "@/lib/affiliate";
import { FAMILY_ORDER, getBestDeals, getDealCounts, getPopular, getReleases, type HomeDeal, type HomeGame } from "@/lib/home";
import { getTitleBundle, getTitleBySlug, igdbImage } from "@/lib/titles";
import { VERSIONS, versionPath, versionsOf, type Family, type Version } from "@/lib/versions";
import NewsletterSignup from "@/components/NewsletterSignup";

// Home: a featured deal, the four platforms, three price lists (deals, just released, coming
// soon), the most popular games and a sign-up band. Lists read hourly summaries (lib/home.ts).
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

const day = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);

/** Retry a list once; an empty list beats a broken page. */
async function list<T>(load: () => Promise<T[]>): Promise<T[]> {
  try { return await load(); } catch { try { return await load(); } catch { return []; } }
}

export default async function Home() {
  const today = new Date();
  const [deals, fresh, soon, popular, counts] = await Promise.all([
    list(() => getBestDeals(9)),
    list(() => getReleases(day(addDays(today, -40)), day(today), 8)),
    list(() => getReleases(day(addDays(today, 1)), day(addDays(today, 60)), 8)),
    list(() => getPopular(10)),
    getDealCounts().catch(() => ({} as Partial<Record<Family, number>>)),
  ]);

  // Featured: the most popular big deal that's on the most platforms.
  const featured = [...deals].sort((a, b) => b.families.length - a.families.length)[0] ?? null;
  const rest = deals.filter((d) => d !== featured).slice(0, 8);
  const featuredVersions = featured ? await featuredVersionsOf(featured.slug) : [];

  return (
    <div className="hm">
      {featured && <Featured deal={featured} versions={featuredVersions} />}

      <main className="shell hm-main">
        <section className="hm-block" aria-labelledby="hm-platforms">
          <div className="hm-block-h"><h2 id="hm-platforms">Pick your platform</h2></div>
          <div className="hm-doors">
            {FAMILY_ORDER.map((f) => (
              <div key={f} className={`hm-door pf-${f}`}>
                <Link href={FAMILY[f].href} className="hm-door-h"><span className="hm-mark" aria-hidden>{FAMILY[f].mark}</span>{FAMILY[f].label}</Link>
                {counts[f] ? <small><span className="num">{counts[f]!.toLocaleString("en")}</span> games on sale right now</small> : <small>Browse every game</small>}
                <div className="hm-door-links">
                  {FAMILY[f].links.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
                </div>
              </div>
            ))}
          </div>
        </section>

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

// ─── Featured ────────────────────────────────────────────────────────────────

async function featuredVersionsOf(slug: string): Promise<{ v: Version; href: string }[]> {
  try {
    const title = await getTitleBySlug(slug);
    if (!title) return [];
    const versions = versionsOf(await getTitleBundle(title));
    return versions.map((v) => ({ v, href: versionPath(slug, v, versions) }));
  } catch {
    return [];
  }
}

function Featured({ deal, versions }: { deal: HomeDeal; versions: { v: Version; href: string }[] }) {
  return (
    <section className="hm-featured">
      {deal.art_id && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="hm-featured-art" src={igdbImage(deal.art_id, "t_1080p")} alt="" aria-hidden />
      )}
      <div className="shell hm-featured-inner">
        <div className="hm-featured-main">
          <div className="hm-eyebrow"><b>Featured deal</b> · one of today&apos;s biggest drops on a top game</div>
          <h1>{deal.name}</h1>
          {deal.genres.length > 0 && <div className="hm-meta">{deal.genres.slice(0, 3).join(" · ")}</div>}
          {versions.length > 1 && (
            <div className="hm-chips">
              {versions.map(({ v, href }) => (
                <Link key={v} href={href} className={`hm-chip pf-${VERSIONS[v].family}`}><span aria-hidden />{VERSIONS[v].label}</Link>
              ))}
            </div>
          )}
          <div className="hm-deal">
            <span className="hm-price hm-big num">{money(deal.price)}</span>
            <span className="hm-pill">-{deal.discount_pct}%</span>
            {deal.regular_price && <s className="num">{money(deal.regular_price)}</s>}
            <small>on the {deal.store}{deal.family !== "pc" ? ` (${FAMILY[deal.family].label})` : ""}</small>
          </div>
          <div className="hm-actions">
            <Link href={`/game/${deal.slug}`} className="pp-btn pp-btn-primary">Compare all offers</Link>
          </div>
        </div>
        <Cover id={deal.cover_id} name={deal.name} size="t_cover_big_2x" className="hm-featured-cover" />
      </div>
    </section>
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

function Row({ game, sub, right }: { game: HomeGame | HomeDeal; sub: string; right: React.ReactNode }) {
  return (
    <Link href={`/game/${game.slug}`} className="hm-row">
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
