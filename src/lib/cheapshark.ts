const BASE_URL = "https://www.cheapshark.com/api/1.0";

export interface CheapSharkDeal {
  internalName: string;
  title: string;
  metacriticLink: string;
  dealID: string;
  storeID: string;
  gameID: string;
  salePrice: string;
  normalPrice: string;
  isOnSale: string;
  savings: string;
  metacriticScore: string;
  steamRatingText: string;
  steamRatingPercent: string;
  steamRatingCount: string;
  steamAppID: string | null;
  releaseDate: number;
  lastChange: number;
  dealRating: string;
  thumb: string;
}

export interface CheapSharkGameSearchResult {
  gameID: string;
  steamAppID: string | null;
  cheapest: string;
  cheapestDealID: string;
  external: string;
  internalName: string;
  thumb: string;
}

export interface CheapSharkGameDetail {
  info: {
    title: string;
    steamAppID: string | null;
    thumb: string;
  };
  cheapestPriceEver: {
    price: string;
    date: number;
  };
  deals: Array<{
    storeID: string;
    dealID: string;
    price: string;
    retailPrice: string;
    savings: string;
  }>;
}

export interface CheapSharkStore {
  storeID: string;
  storeName: string;
  isActive: number;
  images: {
    banner: string;
    logo: string;
    icon: string;
  };
}

// Store name mapping for CheapShark store IDs
const STORE_NAMES: Record<string, string> = {
  "1": "Steam",
  "2": "GamersGate",
  "3": "GreenManGaming",
  "7": "GOG",
  "8": "Origin",
  "11": "Humble Store",
  "13": "Uplay",
  "15": "Fanatical",
  "21": "WinGameStore",
  "23": "GameBillet",
  "24": "Voidu",
  "25": "Epic Games Store",
  "27": "Gamesplanet",
  "28": "Gamesload",
  "29": "2Game",
  "30": "IndieGala",
  "31": "Blizzard Shop",
  "33": "DLGamer",
  "34": "Noctre",
  "35": "DreamGame",
};

export function getStoreName(storeID: string): string {
  return STORE_NAMES[storeID] || `Store #${storeID}`;
}

export async function getDeals(params: {
  storeID?: string;
  upperPrice?: number;
  lowerPrice?: number;
  metacritic?: number;
  steamRating?: number;
  sortBy?: "Deal Rating" | "Title" | "Savings" | "Price" | "Metacritic" | "Reviews" | "Release" | "Store" | "Recent";
  pageNumber?: number;
  pageSize?: number;
  onSale?: boolean;
} = {}): Promise<CheapSharkDeal[]> {
  const searchParams = new URLSearchParams();
  if (params.storeID) searchParams.set("storeID", params.storeID);
  if (params.upperPrice !== undefined) searchParams.set("upperPrice", String(params.upperPrice));
  if (params.lowerPrice !== undefined) searchParams.set("lowerPrice", String(params.lowerPrice));
  if (params.metacritic !== undefined) searchParams.set("metacritic", String(params.metacritic));
  if (params.steamRating !== undefined) searchParams.set("steamRating", String(params.steamRating));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.pageNumber !== undefined) searchParams.set("pageNumber", String(params.pageNumber));
  if (params.pageSize !== undefined) searchParams.set("pageSize", String(params.pageSize));
  if (params.onSale) searchParams.set("onSale", "1");

  try {
    const res = await fetch(`${BASE_URL}/deals?${searchParams}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function searchGames(title: string, limit = 10): Promise<CheapSharkGameSearchResult[]> {
  const res = await fetch(`${BASE_URL}/games?title=${encodeURIComponent(title)}&limit=${limit}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`CheapShark search error: ${res.status}`);
  return res.json();
}

export async function getGameById(gameId: string): Promise<CheapSharkGameDetail> {
  const res = await fetch(`${BASE_URL}/games?id=${gameId}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`CheapShark game error: ${res.status}`);
  return res.json();
}

export async function getStores(): Promise<CheapSharkStore[]> {
  const res = await fetch(`${BASE_URL}/stores`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`CheapShark stores error: ${res.status}`);
  return res.json();
}

export function getDealUrl(dealID: string): string {
  return `https://www.cheapshark.com/redirect?dealID=${dealID}`;
}

export function getSteamCoverUrl(steamAppID: string | null): string | null {
  if (!steamAppID) return null;
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${steamAppID}/header.jpg`;
}
