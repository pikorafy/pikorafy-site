import Link from "next/link";
import { notFound } from "next/navigation";
import { STORES, STORE_KEYS, getTitle } from "@/lib/admin/catalog";
import { requireAdmin } from "@/lib/admin/session";
import Notice from "../../Notice";
import { time } from "../../ui";
import { addItem, mergeTitle, moveItem, resetItem, saveTitle, unlinkItem } from "../actions";

const METHOD: Record<string, string> = {
  store_link: "matched by the store's own id on IGDB",
  steam_link: "matched through its Steam version",
  title: "matched by name",
  title_date: "matched by name and release date",
  same_title: "same name as another store's item",
  override: "set by hand",
};

export default async function AdminTitle({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireAdmin();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const title = await getTitle(Number(id));
  if (!title) notFound();
  const path = `/admin/catalog/${title.id}`;

  return (
    <>
      <nav aria-label="Breadcrumb" style={{ fontSize: 13 }}>
        <Link href="/admin/catalog" style={{ textDecoration: "none" }}>Catalog</Link>
        <span className="adm-muted"> / {title.name}</span>
      </nav>

      <header className="adm-head" style={{ alignItems: "flex-start" }}>
        {title.cover_id ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="adm-cover" src={`https://images.igdb.com/igdb/image/upload/t_cover_big/${title.cover_id}.jpg`} alt="" />
        ) : <span className="adm-cover" aria-hidden="true" />}
        <div>
          <h1>{title.name}</h1>
          <p>
            Title {title.id} (IGDB id) · {title.first_release?.slice(0, 4) ?? "no release date"} · {title.items.length} store item{title.items.length === 1 ? "" : "s"} ·{" "}
            <a href={`/game/${title.slug}`} target="_blank" rel="noreferrer">open the page ↗</a>
          </p>
          {title.edit && <p className="adm-help" style={{ marginTop: 6 }}>Name and address set by {title.edit.updated_by ?? "hand"} · {time(title.edit.updated_at)}</p>}
        </div>
      </header>

      <Notice ok={sp.ok} error={sp.error} />

      <div className="adm-grid-wide" style={{ alignItems: "start" }}>
        <section className="adm-card" aria-label="Name and address" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600 }}>Name and address</h2>
          <form action={saveTitle} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input type="hidden" name="id" value={title.id} />
            <div className="adm-two">
              <label className="adm-field">Name<input name="name" defaultValue={title.name} required /></label>
              <label className="adm-field">Address (/game/…)<input name="slug" defaultValue={title.slug} required pattern="[a-z0-9]+(-[a-z0-9]+)*" /></label>
            </div>
            <p className="adm-help">Changing the address keeps the old one working: it redirects here.</p>
            <div><button type="submit" className="adm-btn primary">Save</button></div>
          </form>
          {title.aliases.length > 0 && (
            <p className="adm-help">Old addresses that redirect here: {title.aliases.map((a) => `/game/${a}`).join(", ")}</p>
          )}
        </section>

        <section className="adm-card" aria-label="Merge" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600 }}>Merge into another title</h2>
          <p className="adm-help">
            For duplicates: every store item moves to the other title, this title disappears and its address redirects there.
          </p>
          <form action={mergeTitle} className="adm-inline">
            <input type="hidden" name="title" value={title.id} />
            <label className="sr-only" htmlFor="merge-target">Title to merge into</label>
            <input id="merge-target" name="target" className="adm-input" placeholder="Title id, address or page link" required style={{ flex: 1, minWidth: 200 }} />
            <button type="submit" className="adm-btn danger">Merge</button>
          </form>
        </section>
      </div>

      <section className="adm-card" aria-label="Store items" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="adm-card-head" style={{ marginBottom: 4 }}>
          <h2>Store items</h2>
          <span className="adm-help">Moves and unlinks stick: the daily link-titles run keeps them.</span>
        </div>
        {title.items.length === 0 && <p className="adm-empty">No store items: link-titles removes this title on its next run unless one is added.</p>}
        {title.items.map((it) => (
          <div key={`${it.store}:${it.store_id}`} className={`adm-item${it.overridden ? " is-override" : ""}`}>
            <span className="adm-pf" style={{ background: STORES[it.store].color }} title={STORES[it.store].label}>{STORES[it.store].short}</span>
            <span className="adm-item-main">
              <strong style={{ fontWeight: 600 }}>{it.name}</strong>
              <small>
                {STORES[it.store].label}{it.platforms ? ` · ${it.platforms}` : ""} · <code>{it.store_id}</code> · {METHOD[it.method] ?? it.method}
                {it.overridden && it.override_by ? ` (${it.override_by})` : ""}
              </small>
            </span>
            <div className="adm-actions">
              <form action={moveItem} className="adm-inline">
                <input type="hidden" name="title" value={title.id} />
                <input type="hidden" name="store" value={it.store} />
                <input type="hidden" name="store_id" value={it.store_id} />
                <label className="sr-only" htmlFor={`mv-${it.store}-${it.store_id}`}>Move {it.name} to</label>
                <input id={`mv-${it.store}-${it.store_id}`} name="target" className="adm-input" placeholder="Move to title…" required style={{ width: 170 }} />
                <button type="submit" className="adm-btn">Move</button>
              </form>
              <form action={unlinkItem}>
                <input type="hidden" name="title" value={title.id} />
                <input type="hidden" name="store" value={it.store} />
                <input type="hidden" name="store_id" value={it.store_id} />
                <button type="submit" className="adm-btn danger" title="Take it off this title and keep it off every title">Unlink</button>
              </form>
              {it.overridden && (
                <form action={resetItem}>
                  <input type="hidden" name="store" value={it.store} />
                  <input type="hidden" name="store_id" value={it.store_id} />
                  <input type="hidden" name="return" value={path} />
                  <button type="submit" className="adm-btn" title="Remove the correction; link-titles decides again on its next run">Reset</button>
                </form>
              )}
            </div>
          </div>
        ))}

        <form action={addItem} className="adm-inline" style={{ marginTop: 6 }}>
          <input type="hidden" name="title" value={title.id} />
          <label className="sr-only" htmlFor="add-store">Store</label>
          <select id="add-store" name="store" className="adm-input" defaultValue="steam">
            {STORE_KEYS.map((s) => <option key={s} value={s}>{STORES[s].label}</option>)}
          </select>
          <label className="sr-only" htmlFor="add-id">Store item id</label>
          <input id="add-id" name="store_id" className="adm-input" placeholder="Store item id (Steam app id, Xbox product id…)" required style={{ flex: 1, minWidth: 220 }} />
          <button type="submit" className="adm-btn primary">+ Add store item</button>
        </form>
      </section>
    </>
  );
}
