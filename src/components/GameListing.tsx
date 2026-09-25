import Link from "next/link";
import { GENRES, type ListingGame, type ListingSort } from "@/lib/catalog";

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
  sort: ListingSort;
  page: number;
  pageSize: number;
  games: ListingGame[];
  total: number;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const href = (s: ListingSort, p: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (s !== "popular") params.set("sort", s);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
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

      {query !== undefined && (
        <form action={basePath} method="get" role="search" className="filterbar" style={{ marginBottom: 12 }}>
          <span className="lbl">Search</span>
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Game title…"
            aria-label="Search games"
            style={{ flex: 1, minWidth: 0, background: "transparent", border: 0, outline: 0, color: "var(--text)", fontSize: 14 }}
          />
          {sort !== "popular" && <input type="hidden" name="sort" value={sort} />}
          <button type="submit" className="chip">Search</button>
          {query && <Link href={basePath} className="chip" rel="nofollow">Clear</Link>}
        </form>
      )}
      <nav aria-label="Genres" className="filterbar" style={{ marginBottom: 12, flexWrap: "wrap" }}>
        <span className="lbl">Genre</span>
        <Link href="/games" className="chip" aria-pressed={!activeGenre}>All</Link>
        {GENRES.map((g) => (
          <Link key={g.slug} href={`/games/${g.slug}`} className="chip" aria-pressed={activeGenre === g.slug}>
            {g.name === "Massively Multiplayer" ? "MMO" : g.name}
          </Link>
        ))}
      </nav>
      <nav aria-label="Sort" className="filterbar" style={{ marginBottom: 24, flexWrap: "wrap" }}>
        <span className="lbl">Sort</span>
        {SORTS.map((s) => (
          <Link key={s.key} href={href(s.key, 1)} className="chip" aria-pressed={sort === s.key} rel="nofollow">
            {s.label}
          </Link>
        ))}
      </nav>

      {games.length === 0 ? (
        <p style={{ color: "var(--text-2)" }}>No games here yet — the catalog is still filling up. Check back soon.</p>
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
