import Link from "next/link";
import {
  PAGE_SIZE, STORES, STORE_KEYS, isStore, searchTitles, unlinkedCounts, unlinkedItems, type Store, type TitleFilter,
} from "@/lib/admin/catalog";
import { requireAdmin } from "@/lib/admin/session";
import Notice from "../Notice";
import { fmt } from "../ui";
import { moveItem, resetItem } from "./actions";

type Params = { q?: string; filter?: string; store?: string; page?: string; ok?: string; error?: string };

const FILTERS: { key: TitleFilter; label: string }[] = [
  { key: "all", label: "All titles" },
  { key: "single", label: "On one store only" },
  { key: "corrected", label: "Corrected by hand" },
];

export default async function AdminCatalog({ searchParams }: { searchParams: Promise<Params> }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = sp.q ?? "";
  const page = Math.max(1, Number(sp.page) || 1);
  const unlinked = sp.filter === "unlinked";
  const store: Store = isStore(sp.store) ? sp.store : "steam";
  const filter: TitleFilter = FILTERS.some((f) => f.key === sp.filter) ? (sp.filter as TitleFilter) : "all";
  const counts = await unlinkedCounts();
  const totalUnlinked = STORE_KEYS.reduce((a, s) => a + (counts[s] ?? 0), 0);

  const href = (p: Partial<Params>) => {
    const next = new URLSearchParams();
    const merged = { q, filter: unlinked ? "unlinked" : filter, store: unlinked ? store : undefined, ...p };
    for (const [k, v] of Object.entries(merged)) if (v && !(k === "filter" && v === "all")) next.set(k, String(v));
    const s = next.toString();
    return `/admin/catalog${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <header className="adm-head">
        <div>
          <h1>Catalog</h1>
          <p>Titles and the store items linked to them. Corrections stick: the daily link-titles run keeps them.</p>
        </div>
        <form className="adm-search" action="/admin/catalog" role="search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5f5a75" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <label className="sr-only" htmlFor="catalog-q">Search</label>
          <input id="catalog-q" name="q" type="search" defaultValue={q} placeholder={unlinked ? "Search store items…" : "Search titles, slugs or ids…"} />
          {unlinked && <input type="hidden" name="filter" value="unlinked" />}
          {unlinked && <input type="hidden" name="store" value={store} />}
          {!unlinked && filter !== "all" && <input type="hidden" name="filter" value={filter} />}
          <button type="submit" className="adm-btn primary">Search</button>
        </form>
      </header>

      <Notice ok={sp.ok} error={sp.error} />

      <nav className="adm-chips" aria-label="Views">
        {FILTERS.map((f) => (
          <Link key={f.key} className="adm-chip" href={href({ filter: f.key, store: undefined, page: undefined })}
            aria-current={!unlinked && filter === f.key ? "page" : undefined}>{f.label}</Link>
        ))}
        <Link className="adm-chip" href={href({ filter: "unlinked", store, page: undefined })} aria-current={unlinked ? "page" : undefined}>
          Store items without a title <b>{fmt(totalUnlinked)}</b>
        </Link>
      </nav>

      {unlinked ? (
        <Unlinked store={store} q={q} page={page} counts={counts} href={href} />
      ) : (
        <Titles q={q} filter={filter} page={page} href={href} />
      )}
    </>
  );
}

async function Titles({ q, filter, page, href }: { q: string; filter: TitleFilter; page: number; href: (p: Partial<Params>) => string }) {
  const { rows, total } = await searchTitles(q, filter, page);
  return (
    <section className="adm-card" aria-label="Titles" style={{ padding: "18px 10px 10px" }}>
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead><tr><th scope="col">Title</th><th scope="col">Stores</th><th scope="col">Released</th><th scope="col">Items</th><th scope="col">Status</th></tr></thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td>
                  <Link href={`/admin/catalog/${t.id}`} style={{ fontWeight: 600, textDecoration: "none", color: "var(--a-text)" }}>{t.name}</Link>
                  <small>/game/{t.slug}</small>
                </td>
                <td><span className="adm-pfs">{t.stores.map((s) => <span key={s} className="adm-pf" style={{ background: STORES[s].color }} title={STORES[s].label}>{STORES[s].short}</span>)}</span></td>
                <td>{t.first_release?.slice(0, 4) ?? "—"}</td>
                <td>{t.links}</td>
                <td>{t.edited || t.overridden ? <span className="adm-pill stopped">Corrected</span> : <span className="adm-pill succeeded">Automatic</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="adm-empty">No titles match.</p>}
      </div>
      <Pager page={page} total={total} href={href} noun="titles" />
    </section>
  );
}

async function Unlinked({ store, q, page, counts, href }: {
  store: Store; q: string; page: number; counts: Record<Store, number | null>; href: (p: Partial<Params>) => string;
}) {
  const { rows, total } = await unlinkedItems(store, q, page);
  const returnTo = href({ page: page > 1 ? String(page) : undefined });
  return (
    <section className="adm-card" aria-label="Store items without a title" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <nav className="adm-chips" aria-label="Store">
        {STORE_KEYS.map((s) => (
          <Link key={s} className="adm-chip" href={href({ store: s, page: undefined })} aria-current={s === store ? "page" : undefined}>
            {STORES[s].label} <b>{fmt(counts[s])}</b>
          </Link>
        ))}
      </nav>
      <p className="adm-help">
        These {STORES[store].label} items have no title, so they have no page of their own. Link one by typing the
        title&apos;s id, its address (e.g. <code>elden-ring</code>) or a link to its page. Many are fine as they are:
        software, soundtracks, demos, or games IGDB doesn&apos;t know.
      </p>
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead><tr><th scope="col">Store item</th><th scope="col">Id</th><th scope="col"><span className="sr-only">Link</span></th></tr></thead>
          <tbody>
            {rows.map((it) => (
              <tr key={it.store_id}>
                <td><strong style={{ fontWeight: 600 }}>{it.name}</strong>{it.ignored && <small><span className="adm-pill stopped">Kept off titles by hand</span></small>}</td>
                <td><code style={{ fontSize: 12 }}>{it.store_id}</code></td>
                <td>
                  <div className="adm-actions">
                    <form action={moveItem} className="adm-inline">
                      <input type="hidden" name="title" value="0" />
                      <input type="hidden" name="store" value={store} />
                      <input type="hidden" name="store_id" value={it.store_id} />
                      <input type="hidden" name="return" value={returnTo} />
                      <label className="sr-only" htmlFor={`t-${it.store_id}`}>Title for {it.name}</label>
                      <input id={`t-${it.store_id}`} name="target" className="adm-input" placeholder="Title id or address" required style={{ width: 200 }} />
                      <button type="submit" className="adm-btn primary">Link</button>
                    </form>
                    {it.ignored && (
                      <form action={resetItem}>
                        <input type="hidden" name="store" value={store} />
                        <input type="hidden" name="store_id" value={it.store_id} />
                        <input type="hidden" name="return" value={returnTo} />
                        <button type="submit" className="adm-btn">Let link-titles decide</button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="adm-empty">Nothing here.</p>}
      </div>
      <Pager page={page} total={total} href={href} noun="items" />
    </section>
  );
}

function Pager({ page, total, href, noun }: { page: number; total: number; href: (p: Partial<Params>) => string; noun: string }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return (
    <div className="adm-pager">
      <span>{fmt(total)} {noun}{pages > 1 ? ` · page ${page} of ${fmt(pages)}` : ""}</span>
      {pages > 1 && (
        <span style={{ display: "flex", gap: 6 }}>
          {page > 1 ? <Link className="adm-btn" href={href({ page: String(page - 1) })}>Previous</Link> : <span className="adm-btn" aria-disabled="true" style={{ opacity: .5 }}>Previous</span>}
          {page < pages ? <Link className="adm-btn" href={href({ page: String(page + 1) })}>Next</Link> : <span className="adm-btn" aria-disabled="true" style={{ opacity: .5 }}>Next</span>}
        </span>
      )}
    </div>
  );
}
