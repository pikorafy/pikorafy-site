import type { TitleBundle } from "@/lib/titles";
import type { XboxGame } from "@/lib/xbox";
import type { PsGameDetail } from "@/lib/playstation";
import type { NintendoGameDetail } from "@/lib/nintendo";

// A shared game (title) has one page per platform version, each with its own URL:
//   /game/<slug>                    PC (or, for console-only games, the first version)
//   /game/<slug>-playstation-ps5    …-playstation-ps4
//   /game/<slug>-xbox-xbs           …-xbox-xb1
//   /game/<slug>-nintendo-nsw2      …-nintendo-nsw
// Search and listings show the game once (its family); each version lists only the store
// items sold for that console: a Switch 2 Edition on -nintendo-nsw2, the Switch listing on
// -nintendo-nsw; a cross-gen listing appears on both of its versions.

export type Version = "pc" | "ps5" | "ps4" | "xbs" | "xb1" | "nsw2" | "nsw";
export type Family = "pc" | "playstation" | "xbox" | "nintendo";

export const VERSION_ORDER: Version[] = ["pc", "ps5", "ps4", "xbs", "xb1", "nsw2", "nsw"];

export const VERSIONS: Record<Version, { family: Family; label: string; long: string; suffix: string }> = {
  pc:   { family: "pc",          label: "PC",          long: "PC",                suffix: "" },
  ps5:  { family: "playstation", label: "PS5",         long: "PlayStation 5",     suffix: "playstation-ps5" },
  ps4:  { family: "playstation", label: "PS4",         long: "PlayStation 4",     suffix: "playstation-ps4" },
  xbs:  { family: "xbox",        label: "Xbox Series", long: "Xbox Series X|S",   suffix: "xbox-xbs" },
  xb1:  { family: "xbox",        label: "Xbox One",    long: "Xbox One",          suffix: "xbox-xb1" },
  nsw2: { family: "nintendo",    label: "Switch 2",    long: "Nintendo Switch 2", suffix: "nintendo-nsw2" },
  nsw:  { family: "nintendo",    label: "Switch",      long: "Nintendo Switch",   suffix: "nintendo-nsw" },
};

/** "<slug>-xbox-xbs" → { base: "<slug>", version: "xbs" }; null when no version suffix. */
export function parseVersionSlug(slug: string): { base: string; version: Version } | null {
  for (const v of VERSION_ORDER) {
    const suffix = VERSIONS[v].suffix;
    if (suffix && slug.endsWith(`-${suffix}`)) return { base: slug.slice(0, -suffix.length - 1), version: v };
  }
  return null;
}

// ─── Store items per version ─────────────────────────────────────────────────

const XBOX_SERIES = new Set(["XboxSeriesX", "Xbox"]);   // "Xbox" alone: the catalog's generic label, current gen

/** Xbox Store products sold for a console version; PC-only products go on the PC page. */
export function xboxFor(b: TitleBundle, v: "xbs" | "xb1"): XboxGame[] {
  return b.xboxEditions.filter((x) => (v === "xbs" ? x.platforms.some((p) => XBOX_SERIES.has(p)) : x.platforms.includes("XboxOne")));
}

/** Microsoft Store products that are only for Windows (no console): PC offers. */
export function microsoftPc(b: TitleBundle): XboxGame[] {
  return b.xboxEditions.filter((x) => x.platforms.includes("PC") && !x.platforms.some((p) => XBOX_SERIES.has(p) || p === "XboxOne"));
}

export function psFor(b: TitleBundle, v: "ps5" | "ps4"): PsGameDetail[] {
  return b.playstation.filter((g) => g.platforms.includes(v === "ps5" ? "PS5" : "PS4"));
}

export function nintendoFor(b: TitleBundle, v: "nsw2" | "nsw"): NintendoGameDetail[] {
  return b.nintendo.filter((g) => g.platforms.includes(v === "nsw2" ? "Nintendo Switch 2" : "Nintendo Switch"));
}

/** The versions a game has, in page order (PC, PS5, PS4, Xbox Series, Xbox One, Switch 2, Switch). */
export function versionsOf(b: TitleBundle): Version[] {
  return VERSION_ORDER.filter((v) => {
    switch (v) {
      case "pc": return !!b.steam || microsoftPc(b).length > 0;
      case "ps5": case "ps4": return psFor(b, v).length > 0;
      case "xbs": case "xb1": return xboxFor(b, v).length > 0;
      case "nsw2": case "nsw": return nintendoFor(b, v).length > 0;
    }
  });
}

/** The version shown on the plain /game/<slug> page: PC, else the first console version. */
export const mainVersion = (versions: Version[]): Version | undefined => versions[0];

/** URL of a version's page; the main version has no suffix. */
export function versionPath(slug: string, v: Version, versions: Version[]): string {
  return v === mainVersion(versions) || !VERSIONS[v].suffix ? `/game/${slug}` : `/game/${slug}-${VERSIONS[v].suffix}`;
}

/** Version to open for a store item (used by the old /xbox, /playstation, /nintendo pages). */
export function versionForPlatforms(platforms: string[]): Version | null {
  if (platforms.includes("PS5")) return "ps5";
  if (platforms.includes("PS4")) return "ps4";
  if (platforms.some((p) => XBOX_SERIES.has(p))) return "xbs";
  if (platforms.includes("XboxOne")) return "xb1";
  if (platforms.includes("Nintendo Switch")) return "nsw";
  if (platforms.includes("Nintendo Switch 2")) return "nsw2";
  return null;
}

/** Where an old store page (/xbox/…, /playstation/…, /nintendo/…) of a linked item goes;
 *  /game/ sends a suffix that is the game's main version on to the plain slug. */
export function storeItemPath(titleSlug: string, platforms: string[]): string {
  const v = versionForPlatforms(platforms);
  return v && VERSIONS[v].suffix ? `/game/${titleSlug}-${VERSIONS[v].suffix}` : `/game/${titleSlug}`;
}
