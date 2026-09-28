"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Game search with live results from the catalog (/api/games/search). Lives in the main
// menu, so it is on every page; an empty box shows the most popular games.

interface SearchResult {
  href: string;
  name: string;
  image: string | null;
  platforms: string[];
  price: number | null;
  regularPrice: number | null;
  discountPct: number | null;
  isFree: boolean;
  genres: string[];
}

const money = (n: number) => new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(n);

export default function SiteSearch({ inputRef, onDone }: {
  inputRef?: React.RefObject<HTMLInputElement | null>;
  /** Called after the user picks a result or submits (e.g. to close the menu's search row). */
  onDone?: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchedFor, setSearchedFor] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Debounced live results while the box is open.
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/games/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const body = (await res.json()) as { results: SearchResult[] };
        setResults(body.results);
        setSearchedFor(q);
      } catch {
        /* aborted or offline: keep the previous results */
      }
    }, q ? 180 : 0);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [query, open]);

  // Close on a click outside or Esc.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onClick); document.removeEventListener("keydown", onKey); };
  }, []);

  const done = () => { setOpen(false); onDone?.(); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    done();
    router.push(`/games?q=${encodeURIComponent(query.trim())}`);
  };

  const q = query.trim();
  return (
    <form onSubmit={handleSubmit} role="search">
      <div className="searchbar" ref={wrapRef}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4-4" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          aria-label="Search games"
          placeholder='Search games — try "Elden Ring"'
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
        <span className="search-hint" aria-hidden="true">⌘ K</span>

        {open && (
          <div className="search-dropdown">
            <div className="sd-section">{q ? "matches" : "most popular"}</div>
            {results.map((g) => (
              <Link key={g.href} className="sd-row sd-game" href={g.href} onClick={done}>
                {g.image
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={g.image} alt="" className="sd-thumb" loading="lazy" />
                  : <span className="sd-thumb" />}
                <div style={{ minWidth: 0 }}>
                  <div className="ttl">{g.name}</div>
                  <div className="meta">{[g.platforms.join(" / "), ...g.genres].filter(Boolean).join(" · ")}</div>
                </div>
                <div className="price">
                  {g.isFree ? "Free" : g.price !== null ? money(g.price) : "—"}
                  {(g.discountPct ?? 0) > 0 && <span className="sd-disc">-{g.discountPct}%</span>}
                </div>
              </Link>
            ))}
            {q && searchedFor === q && results.length === 0 && (
              <div className="sd-row" style={{ gridTemplateColumns: "1fr" }}>
                <span className="meta">No games match “{q}”.</span>
              </div>
            )}
            <div className="sd-section" style={{ marginTop: 4 }}>jump to</div>
            <Link
              className="sd-row"
              href={q ? `/games?q=${encodeURIComponent(q)}` : "/games?sort=discount"}
              onClick={done}
              style={{ gridTemplateColumns: "1fr auto" }}
            >
              <div>
                <span style={{ fontFamily: "var(--ff-mono)", fontSize: 12, fontWeight: 600 }}>
                  {q ? "all-results" : "biggest-discounts"}
                </span>
                {" "}<span className="meta">— {q ? `every game matching “${q}”` : "all games sorted by discount"}</span>
              </div>
              <div className="meta">→</div>
            </Link>
          </div>
        )}
      </div>
    </form>
  );
}
