/* eslint-disable @typescript-eslint/no-explicit-any -- probe script: raw, unknown Steam response shapes */
// Read-only probe: which Steam Web API lists can rank games for the catalog?
// Logs, per endpoint, the HTTP status and how many apps it returns (never the key).
//
//   STEAM_API_KEY=… node scripts/probe-steam-lists.mts

const KEY = process.env.STEAM_API_KEY?.trim() ?? "";
const API = "https://api.steampowered.com";

type Probe = { name: string; url: (key: string) => string; count: (body: any) => number; sample?: (body: any) => unknown };

const input = (o: unknown) => `input_json=${encodeURIComponent(JSON.stringify(o))}`;

const PROBES: Probe[] = [
  {
    name: "Full app list (IStoreService/GetAppList, games only, 1st page)",
    url: (k) => `${API}/IStoreService/GetAppList/v1/?key=${k}&include_games=true&include_dlc=false&include_software=false&include_videos=false&include_hardware=false&max_results=50000`,
    count: (b) => b?.response?.apps?.length ?? 0,
    sample: (b) => ({ have_more_results: b?.response?.have_more_results, last_appid: b?.response?.last_appid }),
  },
  {
    name: "Most played (ISteamChartsService/GetMostPlayedGames)",
    url: () => `${API}/ISteamChartsService/GetMostPlayedGames/v1/`,
    count: (b) => b?.response?.ranks?.length ?? 0,
  },
  {
    name: "Games by concurrent players (ISteamChartsService/GetGamesByConcurrentPlayers)",
    url: (k) => `${API}/ISteamChartsService/GetGamesByConcurrentPlayers/v1/?key=${k}&${input({ context: { language: "english", country_code: "ES" } })}`,
    count: (b) => b?.response?.ranks?.length ?? 0,
  },
  {
    name: "Weekly top sellers ES (IStoreTopSellersService/GetWeeklyTopSellers, 1000)",
    url: (k) => `${API}/IStoreTopSellersService/GetWeeklyTopSellers/v1/?key=${k}&${input({ country_code: "ES", context: { language: "english", country_code: "ES" }, page_start: 0, page_count: 1000 })}`,
    count: (b) => b?.response?.ranks?.length ?? 0,
    sample: (b) => ({ next_page_start: b?.response?.next_page_start }),
  },
  {
    name: "Top releases (ISteamChartsService/GetTopReleasesPages)",
    url: (k) => `${API}/ISteamChartsService/GetTopReleasesPages/v1/?key=${k}`,
    count: (b) => (b?.response?.pages ?? []).reduce((n: number, p: any) => n + (p?.item_ids?.length ?? 0), 0),
    sample: (b) => ({ pages: b?.response?.pages?.length }),
  },
  {
    name: "Store query by wishlists (IStoreQueryService/Query, popular upcoming)",
    url: (k) => `${API}/IStoreQueryService/Query/v1/?key=${k}&${input({
      query: { count: 1000, sort: 12, filters: { released_only: false, coming_soon_only: true, type_filters: { include_games: true } } },
      context: { language: "english", country_code: "ES" },
    })}`,
    count: (b) => b?.response?.ids?.length ?? 0,
    sample: (b) => ({ total: b?.response?.metadata?.total_matching_records }),
  },
  {
    name: "Store query by reviews (IStoreQueryService/Query, released games)",
    url: (k) => `${API}/IStoreQueryService/Query/v1/?key=${k}&${input({
      query: { count: 1000, sort: 10, filters: { released_only: true, type_filters: { include_games: true } } },
      context: { language: "english", country_code: "ES" },
    })}`,
    count: (b) => b?.response?.ids?.length ?? 0,
    sample: (b) => ({ total: b?.response?.metadata?.total_matching_records }),
  },
];

console.log(`Steam key present: ${KEY ? "yes" : "no"}`);
for (const p of PROBES) {
  try {
    const res = await fetch(p.url(KEY), { headers: { Accept: "application/json" } });
    const text = await res.text();
    let body: any = null;
    try { body = JSON.parse(text); } catch { /* not JSON */ }
    const n = body ? p.count(body) : 0;
    const extra = body && p.sample ? ` ${JSON.stringify(p.sample(body))}` : "";
    const keys = body?.response ? ` keys=${Object.keys(body.response).join(",")}` : "";
    console.log(`${p.name}: HTTP ${res.status}, ${n} apps${extra}${keys}`);
  } catch (err) {
    console.log(`${p.name}: failed (${String(err).replace(KEY, "***")})`);
  }
}
