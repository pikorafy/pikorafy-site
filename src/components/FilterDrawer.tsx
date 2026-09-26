"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

// "Filters" button + a panel that slides in from the left over the catalog.
// Applying builds a clean /games URL (empty fields left out); the server does the filtering.

export interface FilterState {
  genres: string[];      // slugs
  min: string;
  max: string;
  free: "show" | "hide" | "only";
  platforms: string[];
  sale: boolean;
  score: string;         // "" | "70" | "80" | "90"
}

interface Option { value: string; label: string }

const PRICE_PRESETS: { label: string; min: string; max: string }[] = [
  { label: "Under €5", min: "", max: "5" },
  { label: "Under €10", min: "", max: "10" },
  { label: "Under €20", min: "", max: "20" },
  { label: "€20–40", min: "20", max: "40" },
  { label: "€40+", min: "40", max: "" },
];

export default function FilterDrawer({
  action,
  query,
  sort,
  initial,
  genres,
  platforms,
  scoreSteps,
  activeCount,
}: {
  action: string;
  query?: string;
  sort: string;
  initial: FilterState;
  genres: Option[];
  platforms: Option[];
  scoreSteps: readonly number[];
  activeCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<FilterState>(initial);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  const toggle = (key: "genres" | "platforms", value: string) =>
    setState((s) => ({ ...s, [key]: s[key].includes(value) ? s[key].filter((v) => v !== value) : [...s[key], value] }));

  const apply = (next: FilterState) => {
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    if (next.genres.length) p.set("genre", next.genres.join(","));
    const min = Number(next.min), max = Number(next.max);
    if (next.min !== "" && min >= 0) p.set("min", String(min));
    if (next.max !== "" && max >= 0) p.set("max", String(max));
    if (next.free !== "show") p.set("f2p", next.free);
    if (next.platforms.length) p.set("platform", next.platforms.join(","));
    if (next.sale) p.set("sale", "1");
    if (next.score) p.set("score", next.score);
    if (sort !== "popular") p.set("sort", sort);
    const qs = p.toString().replaceAll("%2C", ",");   // readable "genre=rpg,indie"
    setOpen(false);
    router.push(qs ? `${action}?${qs}` : action);
  };

  const cleared: FilterState = { genres: [], min: "", max: "", free: "show", platforms: [], sale: false, score: "" };

  return (
    <>
      <button type="button" className="chip filter-btn" aria-haspopup="dialog" aria-expanded={open} onClick={() => {
          setState(initial);   // start from the URL (a chip may have been removed since)
          setOpen(true);
        }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M3 5h18M6 12h12M10 19h4" strokeLinecap="round" />
        </svg>
        Filters
        {activeCount > 0 && <span className="filter-count">{activeCount}</span>}
      </button>

      {open && createPortal(
        <div className="fd-root">
          <div className="fd-backdrop" onClick={() => setOpen(false)} />
          <div ref={panelRef} className="fd-panel" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
            <form
              className="fd-form"
              onSubmit={(e) => {
                e.preventDefault();
                apply(state);
              }}
            >
              <header className="fd-head">
                <h2 id={titleId}>Filters</h2>
                <button type="button" className="fd-close" aria-label="Close filters" onClick={() => setOpen(false)}>×</button>
              </header>

              <div className="fd-body">
                <section>
                  <h3>Price range</h3>
                  <div className="fd-range">
                    <label>
                      <span>Min €</span>
                      <input type="number" inputMode="decimal" min={0} step="any" placeholder="0" value={state.min}
                        onChange={(e) => setState((s) => ({ ...s, min: e.target.value }))} />
                    </label>
                    <span className="fd-dash">–</span>
                    <label>
                      <span>Max €</span>
                      <input type="number" inputMode="decimal" min={0} step="any" placeholder="Any" value={state.max}
                        onChange={(e) => setState((s) => ({ ...s, max: e.target.value }))} />
                    </label>
                  </div>
                  <div className="fd-chips">
                    {PRICE_PRESETS.map((p) => (
                      <button key={p.label} type="button" className="chip"
                        aria-pressed={state.min === p.min && state.max === p.max}
                        onClick={() => setState((s) => ({ ...s, min: p.min, max: p.max }))}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="fd-row">
                    <b id={`${titleId}-f2p`}>Free-to-play games</b>
                    <div className="fd-seg" role="radiogroup" aria-labelledby={`${titleId}-f2p`}>
                      {(["show", "hide", "only"] as const).map((v) => (
                        <button key={v} type="button" role="radio" aria-checked={state.free === v}
                          onClick={() => setState((s) => ({ ...s, free: v }))}>
                          {v === "show" ? "Show" : v === "hide" ? "Hide" : "Only"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="fd-switch">
                    <span>
                      <b>On sale only</b>
                      <small>{state.sale ? "Discounted games" : "All prices"}</small>
                    </span>
                    <input type="checkbox" role="switch" checked={state.sale}
                      onChange={(e) => setState((s) => ({ ...s, sale: e.target.checked }))} />
                    <i aria-hidden="true" />
                  </label>
                </section>

                <section>
                  <h3>Platform</h3>
                  <div className="fd-chips">
                    {platforms.map((p) => (
                      <button key={p.value} type="button" className="chip" aria-pressed={state.platforms.includes(p.value)}
                        onClick={() => toggle("platforms", p.value)}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <h3>Genre</h3>
                  <div className="fd-chips">
                    {genres.map((g) => (
                      <button key={g.value} type="button" className="chip" aria-pressed={state.genres.includes(g.value)}
                        onClick={() => toggle("genres", g.value)}>
                        {g.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <h3>Steam reviews</h3>
                  <div className="fd-chips">
                    <button type="button" className="chip" aria-pressed={!state.score} onClick={() => setState((s) => ({ ...s, score: "" }))}>Any</button>
                    {scoreSteps.map((n) => (
                      <button key={n} type="button" className="chip" aria-pressed={state.score === String(n)}
                        onClick={() => setState((s) => ({ ...s, score: String(n) }))}>
                        {n}%+ positive
                      </button>
                    ))}
                  </div>
                </section>

                <p className="fd-note">Prices are for Spain (EUR), the only region tracked for now.</p>
              </div>

              <footer className="fd-foot">
                <button type="button" className="btn btn-ghost" onClick={() => apply(cleared)}>Clear all</button>
                <button type="submit" className="btn btn-primary">Show games</button>
              </footer>
            </form>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
