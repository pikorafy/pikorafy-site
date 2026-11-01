"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  clearOverride, getTitle, isStore, mergeTitles, renameTitle, resolveTitle, setItemTitle, storeItemExists, STORES,
} from "@/lib/admin/catalog";
import { requireAdmin } from "@/lib/admin/session";

// The title editor's actions. Each one ends on the page it came from with ?ok= or ?error=.

const back = (path: string, kind: "ok" | "error", msg: string) =>
  redirect(`${path}${path.includes("?") ? "&" : "?"}${kind}=${encodeURIComponent(msg)}`);

/** The public pages of these titles show the change on their next visit. */
function refreshPages(...slugs: (string | undefined)[]) {
  for (const slug of slugs) if (slug) revalidatePath(`/game/${slug}`);
}

const titlePath = (id: number) => `/admin/catalog/${id}`;
const num = (v: FormDataEntryValue | null) => Number(v);
const str = (v: FormDataEntryValue | null) => String(v ?? "").trim();

export async function saveTitle(form: FormData) {
  const user = await requireAdmin();
  const id = num(form.get("id"));
  const name = str(form.get("name")).replace(/\s+/g, " ");
  const slug = str(form.get("slug")).toLowerCase();
  if (!name) back(titlePath(id), "error", "The name can't be empty.");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) back(titlePath(id), "error", "The address may only use a–z, 0–9 and single dashes.");
  let oldSlug = "";
  try {
    ({ oldSlug } = await renameTitle(id, name, slug, user.name));
  } catch (err) {
    back(titlePath(id), "error", (err as Error).message);
  }
  refreshPages(oldSlug, slug);
  back(titlePath(id), "ok", oldSlug !== slug ? `Saved. /game/${oldSlug} now redirects to /game/${slug}.` : "Saved.");
}

export async function moveItem(form: FormData) {
  const user = await requireAdmin();
  const from = num(form.get("title"));
  const store = str(form.get("store"));
  const storeId = str(form.get("store_id"));
  const returnTo = str(form.get("return")) || titlePath(from);
  if (!isStore(store)) back(returnTo, "error", "Unknown store.");
  const target = await resolveTitle(str(form.get("target")));
  if (!target) back(returnTo, "error", "No title found for that. Use a title id, its address (slug) or a link to its page.");
  if (target!.id === from) back(returnTo, "error", "It's already on this title.");
  await setItemTitle(store as keyof typeof STORES, storeId, target!.id, user.name);
  const fromTitle = from ? await getTitle(from) : null;
  refreshPages(fromTitle?.slug, target!.slug);
  back(returnTo, "ok", from ? `Moved to “${target!.name}”.` : `Linked to “${target!.name}”.`);
}

export async function unlinkItem(form: FormData) {
  const user = await requireAdmin();
  const title = num(form.get("title"));
  const store = str(form.get("store"));
  const storeId = str(form.get("store_id"));
  if (!isStore(store)) back(titlePath(title), "error", "Unknown store.");
  await setItemTitle(store as keyof typeof STORES, storeId, null, user.name);
  refreshPages((await getTitle(title))?.slug);
  back(titlePath(title), "ok", "Unlinked. It won't be linked to any title again until you reset it.");
}

export async function resetItem(form: FormData) {
  await requireAdmin();
  const store = str(form.get("store"));
  const storeId = str(form.get("store_id"));
  const returnTo = str(form.get("return")) || "/admin/catalog";
  if (!isStore(store)) back(returnTo, "error", "Unknown store.");
  await clearOverride(store as keyof typeof STORES, storeId);
  back(returnTo, "ok", "Correction removed: the next link-titles run decides again.");
}

export async function addItem(form: FormData) {
  const user = await requireAdmin();
  const title = num(form.get("title"));
  const store = str(form.get("store"));
  const storeId = str(form.get("store_id")).replace(/^app\//i, "");
  if (!isStore(store)) back(titlePath(title), "error", "Pick a store.");
  if (!storeId) back(titlePath(title), "error", "Enter the store item's id.");
  if (!(await storeItemExists(store as keyof typeof STORES, storeId))) {
    back(titlePath(title), "error", `No ${STORES[store as keyof typeof STORES].label} item ${storeId} in the catalog.`);
  }
  await setItemTitle(store as keyof typeof STORES, storeId, title, user.name);
  refreshPages((await getTitle(title))?.slug);
  back(titlePath(title), "ok", "Store item added to this title.");
}

export async function mergeTitle(form: FormData) {
  const user = await requireAdmin();
  const from = num(form.get("title"));
  const target = await resolveTitle(str(form.get("target")));
  if (!target) back(titlePath(from), "error", "No title found to merge into.");
  let result: { moved: number; fromSlug: string } | undefined;
  try {
    result = await mergeTitles(from, target!.id, user.name);
  } catch (err) {
    back(titlePath(from), "error", (err as Error).message);
  }
  refreshPages(result!.fromSlug, target!.slug);
  back(titlePath(target!.id), "ok", `Merged: ${result!.moved} store item${result!.moved === 1 ? "" : "s"} moved here; /game/${result!.fromSlug} redirects here.`);
}
