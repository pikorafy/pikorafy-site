import "server-only";
import { db } from "./db";

// The admin's catalog: titles (one game across stores), the store items linked to them, and
// the corrections the editor makes. Corrections are written two ways: to title_overrides /
// title_edits, which the daily link-titles run respects, and straight into title_links /
// titles, so the site shows them right away.

export const STORES = {
  steam: { label: "Steam", short: "PC", color: "#000000", table: "games", id: "steam_app_id", name: "name", where: "type = 'game'" },
  xbox: { label: "Xbox", short: "XB", color: "#107c10", table: "xbox_games", id: "product_id", name: "title", where: "true" },
  playstation: { label: "PlayStation", short: "PS", color: "#0062b3", table: "playstation_games", id: "igdb_id", name: "title", where: "true" },
  nintendo: { label: "Nintendo", short: "NS", color: "#c42b22", table: "nintendo_games", id: "nsuid", name: "title", where: "true" },
} as const;
export type Store = keyof typeof STORES;
export const STORE_KEYS = Object.keys(STORES) as Store[];
export const isStore = (s: unknown): s is Store => typeof s === "string" && s in STORES;

export const PAGE_SIZE = 50;

export interface TitleRow {
  id: number;
  name: string;
  slug: string;
  first_release: string | null;
  cover_id: string | null;
  stores: Store[];
  links: number;
  edited: boolean;
  overridden: boolean;
}

export type TitleFilter = "all" | "corrected" | "single";

export async function searchTitles(q: string, filter: TitleFilter, page: number): Promise<{ rows: TitleRow[]; total: number }> {
  const term = q.trim();
  const where: string[] = [];
  const args: (string | number)[] = [];
  if (term) {
    if (/^\d+$/.test(term)) { where.push("(t.id = ? or t.name ilike ?)"); args.push(Number(term), `%${term}%`); }
    else { where.push("(t.name ilike ? or t.slug ilike ?)"); args.push(`%${term}%`, `%${term}%`); }
  }
  if (filter === "corrected") where.push(`(exists (select 1 from public.title_edits e where e.title_id = t.id)
    or exists (select 1 from public.title_overrides o where o.title_id = t.id))`);
  if (filter === "single") where.push("(select count(distinct l.store) from public.title_links l where l.title_id = t.id) = 1");
  const sqlWhere = where.length ? `where ${where.join(" and ")}` : "";

  const order = term ? "order by (lower(t.name) = lower(?)) desc, (t.name ilike ?) desc, length(t.name), t.name" : "order by t.name";
  const orderArgs = term ? [term, `${term}%`] : [];
  const rows = (await db().raw(
    `select t.id, t.name, t.slug, to_char(t.first_release, 'YYYY-MM-DD') as first_release, t.cover_id,
       coalesce((select array_agg(distinct l.store) from public.title_links l where l.title_id = t.id), '{}') as stores,
       (select count(*) from public.title_links l where l.title_id = t.id)::int as links,
       exists (select 1 from public.title_edits e where e.title_id = t.id) as edited,
       exists (select 1 from public.title_overrides o where o.title_id = t.id) as overridden
     from public.titles t ${sqlWhere} ${order} limit ? offset ?`,
    [...args, ...orderArgs, PAGE_SIZE, (page - 1) * PAGE_SIZE],
  )).rows as TitleRow[];
  const total = Number((await db().raw(`select count(*) n from public.titles t ${sqlWhere}`, args)).rows[0].n);
  for (const r of rows) r.stores = STORE_KEYS.filter((s) => r.stores.includes(s));
  return { rows, total };
}

export interface StoreItem {
  store: Store;
  store_id: string;
  name: string;
  /** Kept off every title on purpose (an override with no title). */
  ignored?: boolean;
}

/** Store items that aren't linked to any title. */
export async function unlinkedItems(store: Store, q: string, page: number): Promise<{ rows: StoreItem[]; total: number }> {
  const s = STORES[store];
  const args: (string | number)[] = [store];
  let search = "";
  if (q.trim()) { search = `and (i.${s.name} ilike ? or i.${s.id}::text = ?)`; args.push(`%${q.trim()}%`, q.trim()); }
  const from = `from public.${s.table} i
    left join public.title_overrides o on o.store = ? and o.store_id = i.${s.id}::text
    where ${s.where.replace(/\b(type)\b/, "i.$1")}
      and not exists (select 1 from public.title_links l where l.store = '${store}' and l.store_id = i.${s.id}::text) ${search}`;
  const rows = (await db().raw(
    `select i.${s.id}::text as store_id, i.${s.name} as name, (o.store is not null and o.title_id is null) as ignored
     ${from} order by i.${s.name} limit ? offset ?`,
    [...args, PAGE_SIZE, (page - 1) * PAGE_SIZE],
  )).rows as { store_id: string; name: string; ignored: boolean }[];
  const total = Number((await db().raw(`select count(*) n ${from}`, args)).rows[0].n);
  return { rows: rows.map((r) => ({ ...r, store })), total };
}

export async function unlinkedCounts(): Promise<Record<Store, number | null>> {
  const out = {} as Record<Store, number | null>;
  await Promise.all(STORE_KEYS.map(async (store) => {
    const s = STORES[store];
    try {
      const { rows } = await db().raw(
        `select count(*) n from public.${s.table} i where ${s.where.replace(/\b(type)\b/, "i.$1")}
           and not exists (select 1 from public.title_links l where l.store = ? and l.store_id = i.${s.id}::text)`, [store]);
      out[store] = Number(rows[0].n);
    } catch {
      out[store] = null;
    }
  }));
  return out;
}

export interface TitleDetail {
  id: number;
  name: string;
  slug: string;
  first_release: string | null;
  cover_id: string | null;
  game_type: number | null;
  edit: { name: string | null; slug: string | null; updated_by: string | null; updated_at: Date } | null;
  aliases: string[];
  items: (StoreItem & { method: string; overridden: boolean; override_by: string | null; platforms: string | null })[];
}

export async function getTitle(id: number): Promise<TitleDetail | null> {
  const t = await db()("titles")
    .select("id", "name", "slug", db().raw("to_char(first_release, 'YYYY-MM-DD') as first_release"), "cover_id", "game_type")
    .where({ id }).first();
  if (!t) return null;
  const edit = await db()("title_edits").select("name", "slug", "updated_by", "updated_at").where({ title_id: id }).first();
  const aliases = (await db()("title_slug_aliases").select("slug").where({ title_id: id }).orderBy("slug")).map((a: { slug: string }) => a.slug);
  const links: { store: Store; store_id: string; method: string; overridden: boolean; override_by: string | null }[] = (await db().raw(
    `select l.store, l.store_id, l.method, (o.store is not null) as overridden, o.created_by as override_by
     from public.title_links l left join public.title_overrides o on o.store = l.store and o.store_id = l.store_id
     where l.title_id = ? order by l.store, l.store_id`, [id])).rows;
  const items = await Promise.all(links.map(async (l) => ({ ...l, ...(await itemInfo(l.store, l.store_id)) })));
  return { ...t, edit: edit ?? null, aliases, items };
}

/** Name and platforms of one store item, for display. */
export async function itemInfo(store: Store, storeId: string): Promise<{ name: string; platforms: string | null }> {
  const s = STORES[store];
  const platformCol = store === "steam" ? "null" : "array_to_string(platforms, ', ')";
  try {
    const { rows } = await db().raw(`select ${s.name} as name, ${platformCol} as platforms from public.${s.table} where ${s.id}::text = ?`, [storeId]);
    return { name: rows[0]?.name ?? `(not in the ${s.label} catalog any more)`, platforms: rows[0]?.platforms ?? null };
  } catch {
    const { rows } = await db().raw(`select ${s.name} as name from public.${s.table} where ${s.id}::text = ?`, [storeId]);
    return { name: rows[0]?.name ?? `(not in the ${s.label} catalog any more)`, platforms: null };
  }
}

/** A title from what an editor typed: its id, its slug (or an old slug), or a page address. */
export async function resolveTitle(input: string): Promise<{ id: number; slug: string; name: string } | null> {
  let v = input.trim();
  const fromUrl = v.match(/\/game\/([a-z0-9-]+)/i);
  if (fromUrl) v = fromUrl[1];
  v = v.toLowerCase();
  if (!v) return null;
  if (/^\d+$/.test(v)) {
    const byId = await db()("titles").select("id", "slug", "name").where({ id: Number(v) }).first();
    if (byId) return byId;
  }
  const bySlug = await db()("titles").select("id", "slug", "name").where({ slug: v }).first();
  if (bySlug) return bySlug;
  const alias = await db()("title_slug_aliases").select("title_id").where({ slug: v }).first();
  if (alias) return (await db()("titles").select("id", "slug", "name").where({ id: alias.title_id }).first()) ?? null;
  // A version page (…-playstation-ps5): the main title.
  const base = v.replace(/-(playstation-ps[45]|xbox-xb[s1]|nintendo-nsw2?)$/, "");
  if (base !== v) return resolveTitle(base);
  return null;
}

export async function storeItemExists(store: Store, storeId: string): Promise<boolean> {
  const s = STORES[store];
  const { rows } = await db().raw(`select 1 from public.${s.table} where ${s.id}::text = ? limit 1`, [storeId]);
  return rows.length > 0;
}

// ─── Corrections ─────────────────────────────────────────────────────────────

/** Link a store item to a title (or to none, with titleId null), and keep it that way. */
export async function setItemTitle(store: Store, storeId: string, titleId: number | null, by: string) {
  await db().transaction(async (tx) => {
    await tx.raw(
      `insert into public.title_overrides (store, store_id, title_id, created_by) values (?, ?, ?, ?)
       on conflict (store, store_id) do update set title_id = excluded.title_id, created_by = excluded.created_by, created_at = now()`,
      [store, storeId, titleId, by],
    );
    if (titleId === null) {
      await tx("title_links").where({ store, store_id: storeId }).del();
    } else {
      await tx.raw(
        `insert into public.title_links (store, store_id, title_id, method) values (?, ?, ?, 'override')
         on conflict (store, store_id) do update set title_id = excluded.title_id, method = 'override', updated_at = now()`,
        [store, storeId, titleId],
      );
    }
  });
}

/** Drop a manual correction: the next link-titles run decides again. */
export async function clearOverride(store: Store, storeId: string) {
  await db()("title_overrides").where({ store, store_id: storeId }).del();
}

export async function renameTitle(id: number, name: string, slug: string, by: string): Promise<{ oldSlug: string }> {
  return db().transaction(async (tx) => {
    const t = await tx("titles").select("slug", "name").where({ id }).first();
    if (!t) throw new Error("This title doesn't exist any more.");
    if (slug !== t.slug) {
      const clash = await tx("titles").select("name").where({ slug }).whereNot({ id }).first();
      if (clash) throw new Error(`The address /game/${slug} already belongs to “${clash.name}”.`);
      await tx("title_slug_aliases").where({ slug }).del();
      await tx.raw(
        `insert into public.title_slug_aliases (slug, title_id) values (?, ?)
         on conflict (slug) do update set title_id = excluded.title_id`, [t.slug, id]);
    }
    await tx("titles").where({ id }).update({ name, slug });
    await tx.raw(
      `insert into public.title_edits (title_id, name, slug, updated_by) values (?, ?, ?, ?)
       on conflict (title_id) do update set name = excluded.name, slug = excluded.slug, updated_by = excluded.updated_by, updated_at = now()`,
      [id, name, slug, by],
    );
    return { oldSlug: t.slug as string };
  });
}

/** Move every store item of one title to another; the old title's addresses redirect there. */
export async function mergeTitles(fromId: number, intoId: number, by: string): Promise<{ moved: number; fromSlug: string }> {
  if (fromId === intoId) throw new Error("A title can't be merged into itself.");
  const from = await db()("titles").select("slug").where({ id: fromId }).first();
  if (!from) throw new Error("This title doesn't exist any more.");
  const links: { store: Store; store_id: string }[] = await db()("title_links").select("store", "store_id").where({ title_id: fromId });
  for (const l of links) await setItemTitle(l.store, l.store_id, intoId, by);
  await db().transaction(async (tx) => {
    await tx("title_overrides").where({ title_id: fromId }).update({ title_id: intoId, created_by: by });
    await tx("title_slug_aliases").where({ title_id: fromId }).update({ title_id: intoId });
    await tx.raw(
      `insert into public.title_slug_aliases (slug, title_id) values (?, ?)
       on conflict (slug) do update set title_id = excluded.title_id`, [from.slug, intoId]);
    await tx("title_edits").where({ title_id: fromId }).del();
    await tx("titles").where({ id: fromId }).del();
  });
  return { moved: links.length, fromSlug: from.slug };
}
