import type { Metadata } from "next";
import Link from "next/link";
import { getXboxCategories, getXboxListing, type XboxGame, type XboxSort } from "@/lib/xbox";

const PAGE_SIZE = 48;

const SORTS: { key: XboxSort; label: string }[] = [
  { key: "popular", label: "Most played" },
  { key: "discount", label: "On sale" },
  { key: "price", label: "Lowest price" },
  { key: "rating", label: "Best rated" },
];

export const metadata: Metadata = {
  title: "Xbox Games: Prices, Deals & Discounts",
  description:
    "Browse popular Xbox Series X|S, Xbox One and PC games from the Microsoft Store with current prices in euros and today's discounts.",
  alternates: { canonical: "/xbox" },
};

type Params = { [key: string]: string | string[] | undefined };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function XboxPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const sort = SORTS.some((s) => s.key === one(params.sort)) ? (one(params.sort) as XboxSort) : "popular";
  const pageNum = Number(one(params.page));
  const page = Number.isInteger(pageNum) && pageNum > 1 ? pageNum : 1;
  const category = one(params.category) || undefined;

  const [{ games, total }, categories] = await Promise.all([
    getXboxListing({ category, sort, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
    getXboxCategories(12),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const href = (next: { sort?: XboxSort; page?: number; category?: string | null }) => {
    const s = next.sort ?? sort;
    const c = next.category === undefined ? category : next.category;
    const p = next.page ?? 1;
    const qs = new URLSearchParams();
    if (s !== "popular") qs.set("sort", s);
    if (c) qs.set("category", c);
    if (p > 1) qs.set("page", String(p));
    const str = qs.toString();
    return str ? `/xbox?${str}` : "/xbox";
  };

  return (
    <div className="shell" style={{ paddingTop: 48, paddingBottom: 80 }}>
      <div className="section-hd" style={{ marginBottom: 12 }}>
        <div>
          <div className="eyebrow">Xbox · {total.toLocaleString("en")} games</div>
          <h1 className="h2" style={{ fontSize: "clamp(30px,5vw,48px)" }}>Xbox games. <em>Prices in euros.</em></h1>
        </div>
      </div>
      <p style={{ color: "var(--text-2)", maxWidth: "70ch", lineHeight: 1.6, margin: "0 0 24px" }}>
        Popular games from the Microsoft Store for Xbox Series X|S, Xbox One and PC, with current prices and discounts from the
        Spanish store, refreshed several times a day.
      </p>

      {categories.length > 0 && (
        <nav aria-label="Categories" className="filterbar" style={{ marginBottom: 12, flexWrap: "wrap" }}>
          <span className="lbl">Category</span>
          <Link href={href({ category: null })} className="chip" aria-pressed={!category} rel="nofollow">All</Link>
          {categories.map((c) => (
            <Link key={c.name} href={href({ category: c.name })} className="chip" aria-pressed={category === c.name} rel="nofollow">
              {c.name} <span className="count">{c.count}</span>
            </Link>
          ))}
        </nav>
      )}
      <nav aria-label="Sort" className="filterbar" style={{ marginBottom: 24, flexWrap: "wrap" }}>
        <span className="lbl">Sort</span>
        {SORTS.map((s) => (
          <Link key={s.key} href={href({ sort: s.key })} className="chip" aria-pressed={sort === s.key} rel="nofollow">{s.label}</Link>
        ))}
      </nav>

      {games.length === 0 ? (
        <p style={{ color: "var(--text-2)" }}>No Xbox games here yet — the catalog is still filling up. Check back soon.</p>
      ) : (
        <div className="cards">
          {games.map((g) => <XboxCard key={g.product_id} game={g} />)}
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Pages" style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center", marginTop: 40, fontFamily: "var(--ff-mono)", fontSize: 12 }}>
          {page > 1 && <Link href={href({ page: page - 1 })} className="btn btn-ghost">← Previous</Link>}
          <span style={{ color: "var(--text-3)", padding: "0 12px" }}>Page {page} of {pages}</span>
          {page < pages && <Link href={href({ page: page + 1 })} className="btn btn-ghost">Next →</Link>}
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
  const money = (n: number) => new Intl.NumberFormat("en-IE", { style: "currency", currency: game.currency ?? "EUR" }).format(n);

  return (
    <a
      href={game.store_url ?? "#"}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="card boxart"
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div className="cover">
        {image
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={`${image}?w=640`} alt={game.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: game.hero_art ? "cover" : "contain", background: "var(--bg-3)" }} />
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
        <div className="title">{game.title}</div>
        <div className="prices">
          <div>
            {onSale && game.regular_price !== null && <div className="was">{money(game.regular_price)}</div>}
            <div className="now">{game.is_free ? "Free" : game.price !== null ? money(game.price) : "—"}</div>
          </div>
          <div className="stores"><b>Xbox Store</b></div>
        </div>
      </div>
    </a>
  );
}
