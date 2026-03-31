// Affiliate link configuration for Pikorafy
// All affiliate relationships must be disclosed per FTC/EU requirements

export interface AffiliateConfig {
  name: string;
  baseUrl: string;
  commission: string;
  tag?: string;
}

export const AFFILIATES: Record<string, AffiliateConfig> = {
  "instant-gaming": {
    name: "Instant Gaming",
    baseUrl: "https://www.instant-gaming.com",
    commission: "5-10%",
    tag: "pikorafy",
  },
};

export function getInstantGamingUrl(path = ""): string {
  return `https://www.instant-gaming.com${path}?igr=pikorafy`;
}

// CheapShark redirect links are already affiliate-tracked through their system
export function getCheapSharkDealUrl(dealID: string): string {
  return `https://www.cheapshark.com/redirect?dealID=${dealID}`;
}

export const AFFILIATE_DISCLOSURE =
  "Some links on this page are affiliate links. We may earn a commission at no extra cost to you when you purchase through these links. This helps support Pikorafy and allows us to keep providing free game deal analysis.";

export const AFFILIATE_DISCLOSURE_SHORT =
  "Affiliate links — we may earn a commission at no extra cost to you.";
