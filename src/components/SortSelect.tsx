"use client";

import { useRouter } from "next/navigation";

// Sort dropdown for the catalog toolbar; keeps every other URL param, resets the page.
export default function SortSelect({
  basePath,
  params,
  sort,
  options,
}: {
  basePath: string;
  /** Current query string without sort / page. */
  params: string;
  sort: string;
  options: { key: string; label: string }[];
}) {
  const router = useRouter();
  return (
    <label className="sort-select">
      <span className="lbl">Sort</span>
      <select
        value={sort}
        onChange={(e) => {
          const p = new URLSearchParams(params);
          if (e.target.value !== "popular") p.set("sort", e.target.value);
          const qs = p.toString().replaceAll("%2C", ",");   // readable "genre=rpg,indie"
          router.push(qs ? `${basePath}?${qs}` : basePath);
        }}
      >
        {options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
      </select>
    </label>
  );
}
