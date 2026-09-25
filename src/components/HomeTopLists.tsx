import Link from "next/link";
import { GENRES, getGenreTop, getMostPlayed, getRecentReleases, type ListingGame } from "@/lib/catalog";

// Home page: two top-10 lists (most played, recent releases) and top-5s per genre,
// straight from the catalog.

const HOME_GENRES = ["Action", "RPG", "Strategy", "Adventure", "Simulation", "Indie"];

export default async function HomeTopLists() {
  const [played, recent, ...byGenre] = await Promise.all([
    getMostPlayed(10),
    getRecentReleases(10),
    ...HOME_GENRES.map((g) => getGenreTop(g, 5)),
  ]);

  return (
    <>
      <section className="section">
        <div className="shell">
          <div className="section-hd">
            <div>
              <div className="eyebrow">Top 10 · updated hourly</div>
              <h2 className="h2">What everyone&rsquo;s <em>playing.</em><br />What just <em>launched.</em></h2>
            </div>
            <Link href="/games" className="btn btn-ghost">Browse all games →</Link>
          </div>
          <div className="toplists">
            <TopList
              eyebrow="Live on Steam"
              title="Most played right now"
              more={{ href: "/games", label: "All games" }}
              games={played}
              meta={(g) => [g.current_players ? `${compact(g.current_players)} playing` : null, g.genres[0]]}
            />
            <TopList
              eyebrow="New on Steam"
              title="Recent releases"
              more={{ href: "/games", label: "All games" }}
              games={recent}
              meta={(g) => [g.release_date ? shortDate(g.release_date) : null, g.genres[0]]}
            />
          </div>
        </div>
      </section>

      <section className="section" style={{ borderTop: "1px solid var(--line)" }}>
        <div className="shell">
          <div className="section-hd">
            <div>
              <div className="eyebrow">Top 5 · by genre</div>
              <h2 className="h2">The best of <em>every genre.</em></h2>
            </div>
          </div>
          <div className="genre-grid">
            {HOME_GENRES.map((name, i) => {
              const slug = GENRES.find((g) => g.name === name)?.slug;
              return (
                <TopList
                  key={name}
                  eyebrow="Most popular"
                  title={name}
                  more={slug ? { href: `/games/${slug}`, label: `All ${name}` } : undefined}
                  games={byGenre[i]}
                  meta={(g) => [g.review_score_pct !== null ? `${g.review_score_pct}% positive` : null]}
                />
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

function TopList({ eyebrow, title, more, games, meta }: {
  eyebrow: string;
  title: string;
  more?: { href: string; label: string };
  games: ListingGame[];
  meta: (g: ListingGame) => (string | null | undefined)[];
}) {
  return (
    <div className="toplist">
      <div className="toplist-hd">
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h3>{title}</h3>
        </div>
        {more && <Link href={more.href}>{more.label} →</Link>}
      </div>
      {games.length === 0 ? (
        <p style={{ color: "var(--text-3)", fontSize: 13 }}>Filling up — check back soon.</p>
      ) : (
        <ol>
          {games.map((g, i) => (
            <li key={g.steam_app_id}>
              <Link href={`/game/${g.slug}`} className="toprow">
                <span className="rk">{i + 1}</span>
                {g.header_image
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={g.header_image} alt="" loading="lazy" />
                  : <span className="ph" />}
                <span className="nm">
                  <b>{g.name}</b>
                  <span>{meta(g).filter(Boolean).join(" · ")}</span>
                </span>
                <span className="pr">
                  <span className="now">{g.is_free ? "Free" : g.price !== null ? money(g.price) : "—"}</span>
                  {(g.discount_pct ?? 0) > 0 && <><br /><span className="off">-{g.discount_pct}%</span></>}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function money(n: number) {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(n);
}

function compact(n: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
