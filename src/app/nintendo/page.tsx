import type { Metadata } from "next";
import Link from "next/link";
import FilterDrawer from "@/components/FilterDrawer";
import SortSelect from "@/components/SortSelect";
import FallbackImg from "@/components/FallbackImg";
import {
  getNintendoListing,
  NINTENDO_GENRES,
  NINTENDO_PLATFORMS,
  nintendoPlatformLabel,
  type NintendoFilters,
  type NintendoGame,
  type NintendoSort,
} from "@/lib/nintendo";

// Nintendo eShop (Switch / Switch 2, Spanish EUR prices). Same toolbar + filter panel as /games.

const PAGE_SIZE = 48;

const SORTS: { key: NintendoSort; label: string }[] = [
  { key: "popular", label: "Most popular" },
  { key: "discount", label: "Biggest discount" },
  { key: "price", label: "Lowest price" },
  { key: "newest", label: "Newest" },
];

type Params = { [key: string]: string | string[] | undefined };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const list = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v : v ? [v] : []).flatMap((x) => x.split(",")).map((x) => x.trim()).filter(Boolean);
const price = (v: string | string[] | undefined) => {
  const s = one(v);
  const n = Number(s);
  return s !== undefined && s !== "" && Number.isFinite(n) && n >= 0 ? Math.min(n, 1000) : undefined;
};

function parse(params: Params) {
  const genreSlugs = list(params.genre).filter((s) => NINTENDO_GENRES.some((g) => g.slug === s));
  const platformKeys = list(params.platform).filter((k) => NINTENDO_PLATFORMS.some((p) => p.key === k));
  const f2p = one(params.f2p);
  const filters: NintendoFilters = {
    genres: genreSlugs.length ? genreSlugs.map((s) => NINTENDO_GENRES.find((g) => g.slug === s)!.name) : undefined,
    platforms: platformKeys.length ? platformKeys.map((k) => NINTENDO_PLATFORMS.find((p) => p.key === k)!.name) : undefined,
    priceMin: price(params.min),
    priceMax: price(params.max),
    free: f2p === "hide" || f2p === "only" ? f2p : undefined,
    onSale: one(params.sale) === "1" || undefined,
  };
  const sortParam = one(params.sort);
  const sort = SORTS.some((s) => s.key === sortParam) ? (sortParam as NintendoSort) : "popular";
  const pageNum = Number(one(params.page));
  return {
    filters,
    genreSlugs,
    platformKeys,
    query: one(params.q)?.trim().slice(0, 80) ?? "",
    sort,
    page: Number.isInteger(pageNum) && pageNum > 1 ? pageNum : 1,
  };
}

/** Query string for filters (+ search), without sort / page. */
function filterQuery(p: ReturnType<typeof parse>, drop?: string): URLSearchParams {
  const qs = new URLSearchParams();
  if (p.query && drop !== "q") qs.set("q", p.query);
  const genres = p.genreSlugs.filter((g) => drop !== `genre:${g}`);
  if (genres.length) qs.set("genre", genres.join(","));
  const plats = p.platformKeys.filter((k) => drop !== `platform:${k}`);
  if (plats.length) qs.set("platform", plats.join(","));
  if (drop !== "price") {
    if (p.filters.priceMin !== undefined) qs.set("min", String(p.filters.priceMin));
    if (p.filters.priceMax !== undefined) qs.set("max", String(p.filters.priceMax));
  }
  if (p.filters.free && drop !== "f2p") qs.set("f2p", p.filters.free);
  if (p.filters.onSale && drop !== "sale") qs.set("sale", "1");
  return qs;
}

function url(qs: URLSearchParams) {
  const s = qs.toString().replaceAll("%2C", ",");
  return s ? `/nintendo?${s}` : "/nintendo";
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<Params> }): Promise<Metadata> {
  const p = parse(await searchParams);
  const filtered = filterQuery(p).toString() !== "";
  return {
    title: "Nintendo Switch Games: eShop Prices & Deals",
    description:
      "Browse Nintendo Switch and Switch 2 games from the eShop with current prices in euros, today's discounts and when each sale ends.",
    alternates: { canonical: "/nintendo" },
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function NintendoPage({ searchParams }: { searchParams: Promise<Params> }) {
  const p = parse(await searchParams);
  const { games, total } = await getNintendoListing({
    query: p.query || undefined,
    filters: p.filters,
    sort: p.sort,
    limit: PAGE_SIZE,
    offset: (p.page - 1) * PAGE_SIZE,
  });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const base = filterQuery(p);
  const filtered = base.toString() !== "";
  const pageHref = (n: number) => {
    const qs = filterQuery(p);
    if (p.sort !== "popular") qs.set("sort", p.sort);
    if (n > 1) qs.set("page", String(n));
    return url(qs);
  };
  const without = (key: string) => {
    const qs = filterQuery(p, key);
    if (p.sort !== "popular") qs.set("sort", p.sort);
    return url(qs);
  };

  const eur = (n: number) => `€${n}`;
  const chips: { label: string; href: string }[] = [
    ...(p.query ? [{ label: `“${p.query}”`, href: without("q") }] : []),
    ...p.genreSlugs.map((g) => ({ label: NINTENDO_GENRES.find((x) => x.slug === g)!.name, href: without(`genre:${g}`) })),
    ...p.platformKeys.map((k) => ({ label: NINTENDO_PLATFORMS.find((x) => x.key === k)!.label, href: without(`platform:${k}`) })),
    ...(p.filters.priceMin !== undefined || p.filters.priceMax !== undefined
      ? [{
          label: p.filters.priceMin !== undefined && p.filters.priceMax !== undefined ? `${eur(p.filters.priceMin)}–${eur(p.filters.priceMax)}`
            : p.filters.priceMin !== undefined ? `From ${eur(p.filters.priceMin)}` : `Up to ${eur(p.filters.priceMax!)}`,
          href: without("price"),
        }]
      : []),
    ...(p.filters.free ? [{ label: p.filters.free === "only" ? "Free-to-play only" : "No free-to-play", href: without("f2p") }] : []),
    ...(p.filters.onSale ? [{ label: "On sale", href: without("sale") }] : []),
  ];
  const onSale = games.filter((g) => (g.discount_pct ?? 0) > 0).length;

  return (
    <div className="shell" style={{ paddingTop: 48, paddingBottom: 80 }}>
      <div className="section-hd" style={{ marginBottom: 12 }}>
        <div>
          <div className="eyebrow">
            Nintendo · {total.toLocaleString("en")} {filtered ? (total === 1 ? "match" : "matches") : "games"}
          </div>
          <h1 className="h2" style={{ fontSize: "clamp(30px,5vw,48px)" }}>Switch games. <em>eShop prices.</em></h1>
        </div>
      </div>
      <p style={{ color: "var(--text-2)", maxWidth: "70ch", lineHeight: 1.6, margin: "0 0 24px" }}>
        {filtered
          ? `${total.toLocaleString("en")} Nintendo Switch games match, most popular first.`
          : `Nintendo Switch and Switch 2 games from the eShop with current prices from the Spanish store, refreshed every six hours. ` +
            (onSale ? `${onSale} of the games on this page are on sale right now.` : "")}
      </p>

      <div className="listing-toolbar">
        <FilterDrawer
          action="/nintendo"
          query={p.query || undefined}
          sort={p.sort}
          initial={{
            genres: p.genreSlugs,
            min: p.filters.priceMin?.toString() ?? "",
            max: p.filters.priceMax?.toString() ?? "",
            free: p.filters.free ?? "show",
            platforms: p.platformKeys,
            sale: !!p.filters.onSale,
            score: "",
          }}
          genres={NINTENDO_GENRES.map((g) => ({ value: g.slug, label: g.name }))}
          platforms={NINTENDO_PLATFORMS.map((x) => ({ value: x.key, label: x.label }))}
          scoreSteps={[]}
          activeCount={chips.length - (p.query ? 1 : 0)}
          note="Prices are from the Spanish eShop (EUR)."
        />
        <form action="/nintendo" method="get" role="search" className="listing-search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input type="search" name="q" defaultValue={p.query} placeholder="Search Switch games…" aria-label="Search Switch games" />
          {[...filterQuery(p, "q")].map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
          {p.sort !== "popular" && <input type="hidden" name="sort" value={p.sort} />}
        </form>
        <SortSelect basePath="/nintendo" params={base.toString()} sort={p.sort} options={SORTS} />
      </div>

      {chips.length > 0 && (
        <div className="active-filters">
          {chips.map((c) => (
            <Link key={c.label} href={c.href} className="chip" rel="nofollow" aria-label={`Remove filter ${c.label}`}>
              {c.label} <span aria-hidden="true">×</span>
            </Link>
          ))}
          <Link href="/nintendo" className="clear" rel="nofollow">Clear all</Link>
        </div>
      )}

      {games.length === 0 ? (
        <p style={{ color: "var(--text-2)" }}>
          {filtered ? "No games match these filters. Try removing one." : "No Nintendo games here yet — the catalog is still filling up."}
        </p>
      ) : (
        <div className="cards">
          {games.map((g) => <NintendoCard key={g.nsuid} game={g} />)}
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Pages" style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center", marginTop: 40, fontFamily: "var(--ff-mono)", fontSize: 12 }}>
          {p.page > 1 && <Link href={pageHref(p.page - 1)} className="btn btn-ghost">← Previous</Link>}
          <span style={{ color: "var(--text-3)", padding: "0 12px" }}>Page {p.page} of {pages}</span>
          {p.page < pages && <Link href={pageHref(p.page + 1)} className="btn btn-ghost">Next →</Link>}
        </nav>
      )}
    </div>
  );
}

function NintendoCard({ game }: { game: NintendoGame }) {
  const onSale = (game.discount_pct ?? 0) > 0;
  const money = (n: number) => new Intl.NumberFormat("en-IE", { style: "currency", currency: game.currency ?? "EUR" }).format(n);
  const status = game.sales_status === "preorder" ? "Pre-order" : game.sales_status === "unreleased" ? "Coming soon" : null;
  return (
    <Link href={`/nintendo/${game.slug}`} className="card boxart" style={{ textDecoration: "none", color: "inherit" }}>
      <div className="cover">
        {/* Wide art (catalog, product page or guessed), then the square art fitted. */}
        <FallbackImg srcs={game.wide_art} last={game.image_square} alt={game.title} loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        {onSale && <div className="disc-tag">-{game.discount_pct}%</div>}
      </div>
      <div className="body">
        <div className="meta">
          <span className="plat">{game.platforms.map((pl) => <span key={pl}>{nintendoPlatformLabel(pl)}</span>)}</span>
          {status && <span>{status}</span>}
        </div>
        <div className="title">{game.title}</div>
        <div className="prices">
          <div>
            {onSale && game.regular_price !== null && <div className="was">{money(game.regular_price)}</div>}
            <div className="now">{game.is_free ? "Free" : game.price !== null ? money(game.price) : "—"}</div>
          </div>
          <div className="stores"><b>eShop</b></div>
        </div>
      </div>
    </Link>
  );
}
