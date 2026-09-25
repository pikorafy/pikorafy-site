// Colour for a price pill: light green at the lowest price a game has had, red at
// its highest, with yellow/orange in between, so "how good is this price" reads at
// a glance.

export const LOW_TONE = "hsl(120 55% 62%)";

/** Colour for position t (0 = historic low, 1 = historic high). */
export function toneAt(t: number): string {
  const k = Math.min(1, Math.max(0, t));
  const hue = Math.round(120 * (1 - k));           // 120 green → 60 yellow → 0 red
  const sat = Math.round(55 + 17 * k);
  const light = Math.round(62 - 2 * k);
  return `hsl(${hue} ${sat}% ${light}%)`;
}

/**
 * Where `price` sits between the historic low and high. Without a known low, fall
 * back to the discount: full price reads red, deep discounts read green.
 */
export function priceTone(price: number, low: number | null, high: number | null, discountPct: number | null): string {
  if (low !== null && high !== null && high > low) return toneAt((price - low) / (high - low));
  if (low !== null && price <= low) return LOW_TONE;
  return toneAt(1 - (discountPct ?? 0) / 100);
}
