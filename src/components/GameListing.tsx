import Link from "next/link";
import { GENRES, PLATFORMS, type ListingFilters, type ListingGame, type ListingSort } from "@/lib/catalog";
import { activeFilterChips, filterParams, SCORE_STEPS } from "@/lib/listing-params";
import FilterDrawer, { type FilterState } from "@/components/FilterDrawer";
import SortSelect from "@/components/SortSelect";

// Server-rendered catalog grid shared by /games and /games/[genre].

export const SORTS: { key: ListingSort; label: string }[] = [
  { key: "popular", label: "Most popular" },
  { key: "discount", label: "Biggest discount" },
  { key: "price", label: "Lowest price" },
  { key: "reviews", label: "Best reviewed" },
];

export function parseSort(value: string | string[] | undefined): ListingSort {
  return SORTS.some((s) => s.key === value) ? (value as ListingSort) : "popular";
}

export function parsePage(value: string | string[] | undefined): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 1 ? n : 1;
}

export default function GameListing({
  basePath,
  eyebrow,
  title,
  intro,
  activeGenre,
  query,
  filters = {},
  sort,
  page,
  pageSize,
  games,
  total,
}: {
  basePath: string;
  eyebrow: string;
  title: React.ReactNode;
  intro: string;
  activeGenre?: string;
  /** Current search text (only /games supports it). */
  query?: string;
  filters?: ListingFilters;
  sort: ListingSort;
  page: number;
  pageSize: number;
  games: ListingGame[];
  total: number;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  // Query string for the current search + filters (no sort / page).
  const baseParams = (f: ListingFilters = filters) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    return filterParams(f, params);
  };
  const href = (s: ListingSort, p: number) => {
    const params = baseParams();
    if (s !== "popular") params.set("sort", s);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString().replaceAll("%2C", ",");
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const withFilters = (f: ListingFilters) => {
    const params = baseParams(f);
    if (sort !== "popular") params.set("sort", sort);
    const qs = params.toString().replaceAll("%2C", ",");
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const withoutQuery = () => {
    const params = filterParams(filters);
    if (sort !== "popular") params.set("sort", sort);
    const qs = params.toString().replaceAll("%2C", ",");
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const chips = activeFilterChips(filters);
  const genreSlug = (name: string) => GENRES.find((g) => g.name === name)?.slug ?? "";
  const drawerState: FilterState = {
    genres: (filters.genres ?? []).map(genreSlug).filter(Boolean),
    min: filters.priceMin?.toString() ?? "",
    max: filters.priceMax?.toString() ?? "",
    hideFree: !!filters.hideFree,
    platforms: filters.platforms ?? [],
    sale: !!filters.onSale,
    score: filters.minScore?.toString() ?? "",
  };

  return (
    <div className="shell" style={{ paddingTop: 48, paddingBottom: 80 }}>
      <div className="section-hd" style={{ marginBottom: 12 }}>
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h1 className="h2" style={{ fontSize: "clamp(30px,5vw,48px)" }}>{title}</h1>
        </div>
      </div>
      <p style={{ color: "var(--text-2)", maxWidth: "70ch", lineHeight: 1.6, margin: "0 0 24px" }}>{intro}</p>

      {/* Toolbar: filters (left), search, sort (right). Genre pages filter within /games. */}
      <div className="listing-toolbar">
        <FilterDrawer
          action={activeGenre ? "/games" : basePath}
          query={query}
          sort={sort}
          initial={activeGenre && !drawerState.genres.length ? { ...drawerState, genres: [activeGenre] } : drawerState}
          genres={GENRES.filter((g) => g.slug !== "free-to-play").map((g) => ({ value: g.slug, label: g.name === "Massively Multiplayer" ? "MMO" : g.name }))}
          platforms={PLATFORMS.map((p) => ({ value: p.key, label: p.label }))}
          scoreSteps={SCORE_STEPS}
          activeCount={chips.length}
        />
        {query !== undefined && (
          <form action={basePath} method="get" role="search" className="listing-search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
            <input type="search" name="q" defaultValue={query} placeholder="Search games…" aria-label="Search games" />
            {[...filterParams(filters)].map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
            {sort !== "popular" && <input type="hidden" name="sort" value={sort} />}
          </form>
        )}
        <SortSelect
          basePath={basePath}
          params={baseParams().toString()}
          sort={sort}
          options={SORTS}
        />
      </div>

      {(chips.length > 0 || query) && (
        <div className="active-filters">
          {query && (
            <Link href={withoutQuery()} className="chip" rel="nofollow" aria-label={`Remove search ${query}`}>
              “{query}” <span aria-hidden="true">×</span>
            </Link>
          )}
          {chips.map((c) => (
            <Link key={c.label} href={withFilters(c.without)} className="chip" rel="nofollow" aria-label={`Remove filter ${c.label}`}>
              {c.label} <span aria-hidden="true">×</span>
            </Link>
          ))}
          <Link href={basePath} className="clear" rel="nofollow">Clear all</Link>
        </div>
      )}

      {games.length === 0 ? (
        <p style={{ color: "var(--text-2)" }}>
          {chips.length || query ? "No games match these filters. Try removing one." : "No games here yet — the catalog is still filling up. Check back soon."}
        </p>
      ) : (
        <div className="cards">
          {games.map((g) => <GameCard key={g.steam_app_id} game={g} />)}
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Pages" style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center", marginTop: 40, fontFamily: "var(--ff-mono)", fontSize: 12 }}>
          {page > 1 && <Link href={href(sort, page - 1)} className="btn btn-ghost">← Previous</Link>}
          <span style={{ color: "var(--text-3)", padding: "0 12px" }}>Page {page} of {pages}</span>
          {page < pages && <Link href={href(sort, page + 1)} className="btn btn-ghost">Next →</Link>}
        </nav>
      )}
    </div>
  );
}

function GameCard({ game }: { game: ListingGame }) {
  const onSale = (game.discount_pct ?? 0) > 0;
  return (
    <Link href={`/game/${game.slug}`} className="card boxart" style={{ textDecoration: "none", color: "inherit" }}>
      <div className="cover">
        {game.header_image
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={game.header_image} alt={game.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ background: "var(--bg-3)", width: "100%", height: "100%" }} />}
        {onSale && <div className="disc-tag">-{game.discount_pct}%</div>}
      </div>
      <div className="body">
        <div className="meta">
          {game.review_score_pct !== null && (
            <span style={{ color: game.review_score_pct >= 80 ? "var(--good)" : game.review_score_pct >= 60 ? "var(--warn)" : "var(--punch)" }}>
              {game.review_score_pct}% positive
            </span>
          )}
          {game.metacritic !== null && <span>MC {game.metacritic}</span>}
        </div>
        <div className="title">{game.name}</div>
        <div className="prices">
          <div>
            {onSale && game.regular_price !== null && <div className="was">{money(game.regular_price)}</div>}
            <div className="now">{game.is_free ? "Free" : game.price !== null ? money(game.price) : "—"}</div>
          </div>
          {game.store && !game.is_free && <div className="stores"><b>{game.store}</b></div>}
        </div>
      </div>
    </Link>
  );
}

function money(n: number) {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(n);
}
