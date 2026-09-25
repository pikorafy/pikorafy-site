// Colour for a price box: green at the lowest price a game has had, red at
// its highest, with yellow/orange in between, so "how good is this price" reads at
// a glance.

export const LOW_TONE = "hsl(128 60% 33%)";

/** Colour for position t (0 = historic low, 1 = historic high). */
export function toneAt(t: number): string {
  const k = Math.min(1, Math.max(0, t));
  // Deep enough for white text everywhere (≥3:1, fine for the large bold price):
  // green → amber → red, easing through yellow quickly where contrast is weakest.
  const hue = Math.round(128 * (1 - k) ** 1.5);
  const sat = Math.round(60 + 12 * k);
  const light = Math.round(33 + 7 * k);
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
