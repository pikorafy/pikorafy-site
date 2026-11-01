import Link from "next/link";
import { STORES } from "@/lib/admin/catalog";
import { REVIEW_PAGE, listReviews, reviewCounts, type ReviewItem } from "@/lib/admin/review";
import { requireAdmin } from "@/lib/admin/session";
import Notice from "../Notice";
import { fmt } from "../ui";
import { askAgain, confirm, moveTo, none, pick, skip } from "./actions";

type Params = { view?: string; kind?: string; page?: string; ok?: string; error?: string };

export default async function AdminReview({ searchParams }: { searchParams: Promise<Params> }) {
  await requireAdmin();
  const sp = await searchParams;
  const view = sp.view === "done" ? "done" : "open";
  const kind = sp.kind === "ambiguous" || sp.kind === "weak" ? sp.kind : "all";
  const page = Math.max(1, Number(sp.page) || 1);
  const [{ rows, total }, counts] = await Promise.all([listReviews(view, kind, page), reviewCounts().catch(() => ({} as Record<string, number>))]);
  const pages = Math.max(1, Math.ceil(total / REVIEW_PAGE));

  const href = (p: Partial<Params>) => {
    const next = new URLSearchParams();
    const merged = { view: view === "open" ? undefined : view, kind: kind === "all" ? undefined : kind, ...p };
    for (const [k, v] of Object.entries(merged)) if (v) next.set(k, String(v));
    const s = next.toString();
    return `/admin/review${s ? `?${s}` : ""}`;
  };
  const here = href({ page: page > 1 ? String(page) : undefined });
  const open = counts.open ?? 0;
  const done = (counts.resolved ?? 0) + (counts.dismissed ?? 0);

  return (
    <>
      <header className="adm-head">
        <div>
          <h1>Review queue</h1>
          <p>Matches the daily link-titles run wasn&apos;t sure about. Each decision is kept: it isn&apos;t asked again.</p>
        </div>
      </header>

      <Notice ok={sp.ok} error={sp.error} />

      <nav className="adm-chips" aria-label="Views">
        <Link className="adm-chip" href={href({ view: undefined, kind: undefined, page: undefined })} aria-current={view === "open" && kind === "all" ? "page" : undefined}>To review <b>{fmt(open)}</b></Link>
        <Link className="adm-chip" href={href({ view: undefined, kind: "ambiguous", page: undefined })} aria-current={view === "open" && kind === "ambiguous" ? "page" : undefined}>Several possible games <b>{fmt(counts["open:ambiguous"] ?? 0)}</b></Link>
        <Link className="adm-chip" href={href({ view: undefined, kind: "weak", page: undefined })} aria-current={view === "open" && kind === "weak" ? "page" : undefined}>Release years differ <b>{fmt(counts["open:weak"] ?? 0)}</b></Link>
        <Link className="adm-chip" href={href({ view: "done", kind: undefined, page: undefined })} aria-current={view === "done" ? "page" : undefined}>Decided <b>{fmt(done)}</b></Link>
      </nav>

      {rows.length === 0 && (
        <section className="adm-card"><p className="adm-empty">
          {view === "open" ? "Nothing to review. The queue fills on the next link-titles run (daily at 03:37 UTC, or Run now on the Jobs page)." : "No decisions yet."}
        </p></section>
      )}

      {rows.map((r) => <ReviewCard key={`${r.store}:${r.store_id}`} r={r} back={here} />)}

      {pages > 1 && (
        <div className="adm-pager">
          <span>{fmt(total)} items · page {page} of {fmt(pages)}</span>
          <span style={{ display: "flex", gap: 6 }}>
            {page > 1 && <Link className="adm-btn" href={href({ page: String(page - 1) })}>Previous</Link>}
            {page < pages && <Link className="adm-btn" href={href({ page: String(page + 1) })}>Next</Link>}
          </span>
        </div>
      )}
    </>
  );
}

function Hidden({ r, back }: { r: ReviewItem; back: string }) {
  return (
    <>
      <input type="hidden" name="store" value={r.store} />
      <input type="hidden" name="store_id" value={r.store_id} />
      <input type="hidden" name="return" value={back} />
    </>
  );
}

function ReviewCard({ r, back }: { r: ReviewItem; back: string }) {
  const s = STORES[r.store];
  const decided = r.status !== "open";
  return (
    <section className="adm-card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <span className="adm-pf" style={{ background: s.color }} title={s.label}>{s.short}</span>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>{r.item_name}</h2>
          <p className="adm-help" style={{ marginTop: 3 }}>
            {s.label} · <code>{r.store_id}</code>{r.item_release ? ` · released ${r.item_release.slice(0, 4)}` : ""} · {r.reason}
          </p>
          {r.current_title && (
            <p className="adm-help" style={{ marginTop: 3 }}>
              Linked now to <Link href={`/admin/catalog/${r.current_title_id}`}>{r.current_title.name}</Link>
            </p>
          )}
        </div>
        {decided ? (
          <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className={`adm-pill ${r.status === "resolved" ? "succeeded" : "stopped"}`}>{r.status === "resolved" ? "Decided" : "Dismissed"}{r.resolved_by ? ` · ${r.resolved_by}` : ""}</span>
            <form action={askAgain}><Hidden r={r} back={back} /><button type="submit" className="adm-btn">Ask again</button></form>
          </span>
        ) : (
          <span className={`adm-pill ${r.kind === "ambiguous" ? "warn" : "queued"}`}>{r.kind === "ambiguous" ? "Several possible games" : "Release years differ"}</span>
        )}
      </div>

      {!decided && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {r.candidates.map((c) => (
              <div key={c.id} className="adm-item">
                <span className="adm-item-main">
                  <strong style={{ fontWeight: 600 }}>{c.name}</strong>
                  <small>
                    {c.year ?? "no release date"} · IGDB {c.id}
                    {c.slug && <> · <a href={`https://www.igdb.com/games/${c.slug}`} target="_blank" rel="noreferrer">IGDB page ↗</a></>}
                    {c.inCatalog && <> · <Link href={`/admin/catalog/${c.id}`}>in our catalog</Link></>}
                  </small>
                </span>
                {r.kind === "weak" ? (
                  <form action={confirm}><Hidden r={r} back={back} /><button type="submit" className="adm-btn primary">The match is right</button></form>
                ) : (
                  <form action={pick}><Hidden r={r} back={back} /><input type="hidden" name="candidate" value={c.id} /><button type="submit" className="adm-btn primary">This one</button></form>
                )}
              </div>
            ))}
          </div>
          <div className="adm-actions" style={{ justifyContent: "flex-start" }}>
            <form action={moveTo} className="adm-inline">
              <Hidden r={r} back={back} />
              <label className="sr-only" htmlFor={`mv-${r.store}-${r.store_id}`}>Another title for {r.item_name}</label>
              <input id={`mv-${r.store}-${r.store_id}`} name="target" className="adm-input" placeholder="Another title (id or address)" required style={{ width: 230 }} />
              <button type="submit" className="adm-btn">Link there</button>
            </form>
            <form action={none}><Hidden r={r} back={back} /><button type="submit" className="adm-btn danger">{r.kind === "weak" ? "Wrong: unlink it" : "None of these"}</button></form>
            <form action={skip}><Hidden r={r} back={back} /><button type="submit" className="adm-btn" title="Leave it as link-titles has it and don't ask again">Dismiss</button></form>
          </div>
        </>
      )}
    </section>
  );
}
