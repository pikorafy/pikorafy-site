import type { Metadata } from "next";
import Link from "next/link";
import FilterDrawer from "@/components/FilterDrawer";
import SortSelect from "@/components/SortSelect";
import {
  cleanXboxTitle,
  getXboxCategories,
  getXboxListing,
  hasGamePassData,
  XBOX_PLATFORMS,
  xboxHref,
  type XboxGame,
  type XboxSort,
} from "@/lib/xbox";

const PAGE_SIZE = 48;

const SORTS: { key: XboxSort; label: string }[] = [
  { key: "popular", label: "Most played" },
  { key: "discount", label: "On sale" },
  { key: "price", label: "Lowest price" },
  { key: "rating", label: "Best rated" },
];

type Params = { [key: string]: string | string[] | undefined };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const list = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v : v ? [v] : []).flatMap((x) => x.split(",")).map((x) => x.trim()).filter(Boolean);
const priceParam = (v: string | string[] | undefined) => {
  const s = one(v);
  const n = Number(s);
  return s !== undefined && s !== "" && Number.isFinite(n) && n >= 0 ? Math.min(n, 1000) : undefined;
};
const slug = (name: string) => name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function parse(params: Params, categories: string[]) {
  // ?category=Name (old links) or ?genre=slug,slug (filter panel).
  const legacy = one(params.category);
  const genreSlugs = [
    ...list(params.genre).filter((g) => categories.some((c) => slug(c) === g)),
    ...(legacy && categories.includes(legacy) ? [slug(legacy)] : []),
  ];
  const platformKeys = list(params.platform).filter((k) => XBOX_PLATFORMS.some((p) => p.key === k));
  const f2p = one(params.f2p);
  const sortParam = one(params.sort);
  const pageNum = Number(one(params.page));
  return {
    genreSlugs: [...new Set(genreSlugs)],
    platformKeys,
    query: one(params.q)?.trim().slice(0, 80) ?? "",
    priceMin: priceParam(params.min),
    priceMax: priceParam(params.max),
    onSale: one(params.sale) === "1",
    gamePass: one(params.gamepass) === "1",
    sort: (SORTS.some((s) => s.key === sortParam) ? sortParam : "popular") as XboxSort,
    page: Number.isInteger(pageNum) && pageNum > 1 ? pageNum : 1,
    free: (f2p === "hide" || f2p === "only" ? f2p : undefined) as "hide" | "only" | undefined,
  };
}
type Parsed = ReturnType<typeof parse>;

/** Query string for search + filters (no sort / page), optionally without one of them. */
function filterQuery(p: Parsed, drop?: string): URLSearchParams {
  const qs = new URLSearchParams();
  if (p.query && drop !== "q") qs.set("q", p.query);
  const genres = p.genreSlugs.filter((g) => drop !== `genre:${g}`);
  if (genres.length) qs.set("genre", genres.join(","));
  const plats = p.platformKeys.filter((k) => drop !== `platform:${k}`);
  if (plats.length) qs.set("platform", plats.join(","));
  if (drop !== "price") {
    if (p.priceMin !== undefined) qs.set("min", String(p.priceMin));
    if (p.priceMax !== undefined) qs.set("max", String(p.priceMax));
  }
  if (p.free && drop !== "f2p") qs.set("f2p", p.free);
  if (p.onSale && drop !== "sale") qs.set("sale", "1");
  if (p.gamePass && drop !== "gamepass") qs.set("gamepass", "1");
  return qs;
}

const url = (qs: URLSearchParams) => {
  const s = qs.toString().replaceAll("%2C", ",");
  return s ? `/xbox?${s}` : "/xbox";
};

export async function generateMetadata({ searchParams }: { searchParams: Promise<Params> }): Promise<Metadata> {
  const params = await searchParams;
  const filtered = Object.keys(params).some((k) => k !== "page" && k !== "sort");
  return {
    title: "Xbox Games: Prices, Deals & Discounts",
    description:
      "Browse popular Xbox Series X|S, Xbox One and PC games from the Microsoft Store with current prices in euros and today's discounts.",
    alternates: { canonical: "/xbox" },
    // Search and filter result pages shouldn't be indexed.
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function XboxPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const [categoryList, showGamePass] = await Promise.all([getXboxCategories(16), hasGamePassData()]);
  const categoryNames = categoryList.map((c) => c.name);
  const p = parse(params, categoryNames);
  const categoriesByslug = new Map(categoryNames.map((c) => [slug(c), c]));

  const { games, total } = await getXboxListing({
    categories: p.genreSlugs.map((g) => categoriesByslug.get(g)!).filter(Boolean),
    platforms: p.platformKeys.map((k) => XBOX_PLATFORMS.find((x) => x.key === k)!.code),
    query: p.query || undefined,
    priceMin: p.priceMin,
    priceMax: p.priceMax,
    free: p.free,
    onSale: p.onSale,
    gamePass: p.gamePass,
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
    ...p.genreSlugs.map((g) => ({ label: categoriesByslug.get(g) ?? g, href: without(`genre:${g}`) })),
    ...p.platformKeys.map((k) => ({ label: XBOX_PLATFORMS.find((x) => x.key === k)!.label, href: without(`platform:${k}`) })),
    ...(p.priceMin !== undefined || p.priceMax !== undefined
      ? [{
          label: p.priceMin !== undefined && p.priceMax !== undefined ? `${eur(p.priceMin)}–${eur(p.priceMax)}`
            : p.priceMin !== undefined ? `From ${eur(p.priceMin)}` : `Up to ${eur(p.priceMax!)}`,
          href: without("price"),
        }]
      : []),
    ...(p.free ? [{ label: p.free === "only" ? "Free-to-play only" : "No free-to-play", href: without("f2p") }] : []),
    ...(p.onSale ? [{ label: "On sale", href: without("sale") }] : []),
    ...(p.gamePass ? [{ label: "In Game Pass", href: without("gamepass") }] : []),
  ];

  return (
    <div className="shell" style={{ paddingTop: 48, paddingBottom: 80 }}>
      <div className="section-hd" style={{ marginBottom: 12 }}>
        <div>
          <div className="eyebrow">Xbox · {total.toLocaleString("en")} {filtered ? (total === 1 ? "match" : "matches") : total === 1 ? "game" : "games"}</div>
          <h1 className="h2" style={{ fontSize: "clamp(30px,5vw,48px)" }}>Xbox games. <em>Prices in euros.</em></h1>
        </div>
      </div>
      <p style={{ color: "var(--text-2)", maxWidth: "70ch", lineHeight: 1.6, margin: "0 0 24px" }}>
        {filtered
          ? `${total.toLocaleString("en")} Xbox games match, most played first.`
          : "Popular games from the Microsoft Store for Xbox Series X|S, Xbox One and PC, with current prices and discounts from the Spanish store, refreshed several times a day."}
      </p>

      <div className="listing-toolbar">
        <FilterDrawer
          action="/xbox"
          query={p.query || undefined}
          sort={p.sort}
          initial={{
            genres: p.genreSlugs,
            min: p.priceMin?.toString() ?? "",
            max: p.priceMax?.toString() ?? "",
            free: p.free ?? "show",
            platforms: p.platformKeys,
            sale: p.onSale,
            score: "",
            gamePass: p.gamePass,
          }}
          genres={categoryNames.map((c) => ({ value: slug(c), label: c }))}
          genreTitle="Category"
          platforms={XBOX_PLATFORMS.map((x) => ({ value: x.key, label: x.label }))}
          scoreSteps={[]}
          gamePassToggle={showGamePass}
          activeCount={chips.length - (p.query ? 1 : 0)}
          note="Prices are from the Spanish Microsoft Store (EUR)."
        />
        <form action="/xbox" method="get" role="search" className="listing-search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input type="search" name="q" defaultValue={p.query} placeholder="Search Xbox games…" aria-label="Search Xbox games" />
          {[...filterQuery(p, "q")].map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
          {p.sort !== "popular" && <input type="hidden" name="sort" value={p.sort} />}
        </form>
        <SortSelect basePath="/xbox" params={base.toString()} sort={p.sort} options={SORTS} />
      </div>

      {chips.length > 0 && (
        <div className="active-filters">
          {chips.map((c) => (
            <Link key={c.label} href={c.href} className="chip" rel="nofollow" aria-label={`Remove filter ${c.label}`}>
              {c.label} <span aria-hidden="true">×</span>
            </Link>
          ))}
          <Link href="/xbox" className="clear" rel="nofollow">Clear all</Link>
        </div>
      )}

      {games.length === 0 ? (
        <p style={{ color: "var(--text-2)" }}>
          {filtered ? "No games match these filters. Try removing one." : "No Xbox games here yet — the catalog is still filling up. Check back soon."}
        </p>
      ) : (
        <div className="cards">
          {games.map((g) => <XboxCard key={g.product_id} game={g} />)}
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

// Store platform codes → card labels; anything not listed (e.g. "Handheld") is hidden.
const PLATFORM_LABEL: Record<string, string> = { XboxSeriesX: "Series X|S", XboxOne: "One", PC: "PC", Xbox: "Xbox", XCloud: "Cloud" };

function XboxCard({ game }: { game: XboxGame }) {
  const onSale = (game.discount_pct ?? 0) > 0;
  const platforms = game.platforms.filter((p) => PLATFORM_LABEL[p]);
  const image = game.hero_art ?? game.box_art;
  const title = cleanXboxTitle(game.title);
  const fromPrice = game.edition_count > 1 && game.group_min_price !== null && game.price !== null && game.group_min_price < game.price;
  const money = (n: number) => new Intl.NumberFormat("en-IE", { style: "currency", currency: game.currency ?? "EUR" }).format(n);

  return (
    <Link href={xboxHref(game)} className="card boxart" style={{ textDecoration: "none", color: "inherit" }}>
      <div className="cover">
        {image
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={`${image}?w=640`} alt={title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: game.hero_art ? "cover" : "contain", background: "var(--bg-3)" }} />
          : <div style={{ background: "var(--bg-3)", width: "100%", height: "100%" }} />}
        {onSale && <div className="disc-tag">-{game.discount_pct}%</div>}
      </div>
      <div className="body">
        <div className="meta">
          {platforms.length > 0 && (
            <span className="plat">{platforms.map((p) => <span key={p}>{PLATFORM_LABEL[p]}</span>)}</span>
          )}
          {game.rating !== null && (game.rating_count ?? 0) > 0 && <span>★ {game.rating.toFixed(1)}</span>}
        </div>
        <div className="title">{title}</div>
        <div className="prices">
          <div>
            {onSale && game.regular_price !== null && <div className="was">{money(game.regular_price)}</div>}
            <div className="now">
              {game.is_free ? "Free" : fromPrice ? <><small style={{ fontSize: "0.6em", fontWeight: 500 }}>from </small>{money(game.group_min_price!)}</> : game.price !== null ? money(game.price) : "—"}
            </div>
            {game.edition_count > 1 && <div className="was" style={{ textDecoration: "none" }}>{game.edition_count} editions</div>}
          </div>
          <div className="stores"><b>{game.game_slug ? "Xbox + PC" : "Xbox Store"}</b></div>
        </div>
      </div>
    </Link>
  );
}
