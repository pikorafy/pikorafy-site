import type { XboxGame } from "@/lib/xbox";

const XBOX_PLATFORM: Record<string, string> = { XboxSeriesX: "Xbox Series X|S", XboxOne: "Xbox One", Xbox: "Xbox", PC: "PC", XCloud: "Cloud gaming" };

const money = (n: number, currency: string) => new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(n);

/** Readable platform names; `withPc` adds "PC" (off on Steam pages, which already list Windows). */
export function xboxPlatforms(products: XboxGame[], withPc = false): string[] {
  const all = new Set(products.flatMap((p) => p.platforms.map((pl) => XBOX_PLATFORM[pl]).filter(Boolean)));
  // "Xbox" is the catalog's generic label; drop it when the specific consoles are known.
  if (all.has("Xbox Series X|S") || all.has("Xbox One")) all.delete("Xbox");
  if (!withPc) all.delete("PC");
  return [...all];
}

/** Xbox Store prices, kept apart from the PC key/store comparison. */
export default function XboxOffers({ name, products, included = [], first = false }: {
  name: string;
  products: XboxGame[];
  /** Subscriptions that include the game ("Xbox Game Pass Ultimate", "EA Play"…). */
  included?: string[];
  /** Drop the top margin when this is the first section on the page. */
  first?: boolean;
}) {
  // Unpriced products are usually delisted editions; show them only when nothing else is sold.
  const shown = products.some((p) => p.price !== null) ? products.filter((p) => p.price !== null) : products;
  return (
    <section style={{ marginTop: first ? 0 : 40 }} aria-labelledby="xbox-offers">
      <div className="eyebrow">Xbox Store · Microsoft Store Spain · prices in EUR</div>
      <h2 id="xbox-offers" className="h2" style={{ fontSize: "clamp(22px,3.5vw,28px)", marginBottom: 16 }}>{name} on Xbox</h2>
      {included.length > 0 && (
        <p className="xbox-included">
          <span aria-hidden>✓</span> Included with {included.join(", ")}
        </p>
      )}
      <div className="offers">
        <div className="hd">
          <div>#</div>
          <div>Store</div>
          <div>Price</div>
          <div>Regular price</div>
          <div>Discount</div>
          <div />
        </div>
        {shown.map((p, i) => {
          const cur = p.currency ?? "EUR";
          const platforms = xboxPlatforms([p], true).join(" · ");
          return (
            <div key={p.product_id} className="row">
              <div className="rank">{String(i + 1).padStart(2, "0")}</div>
              <div className="store-block">
                <div className="store-logo">XBX</div>
                <div>
                  <div className="sname">Xbox Store</div>
                  <div className="smeta">{[p.title !== name ? p.title : "", platforms].filter(Boolean).join(" · ")}</div>
                </div>
              </div>
              <div className="price-cell">
                <div className="pp">{p.is_free ? "Free" : p.price !== null ? money(p.price, cur) : "—"}</div>
                {p.price === null && <div className="pf">See the store</div>}
              </div>
              <div className="price-cell"><div className="pf" style={{ fontSize: 13 }}>{p.regular_price ? money(p.regular_price, cur) : "—"}</div></div>
              <div className="price-cell"><div className="pf" style={{ fontSize: 13 }}>{p.discount_pct ? `-${p.discount_pct}%` : "—"}</div></div>
              {p.store_url ? (
                <a href={p.store_url} target="_blank" rel="noopener noreferrer" className="gobtn" style={{ textDecoration: "none", textAlign: "center" }}>Get →</a>
              ) : <div />}
            </div>
          );
        })}
      </div>
    </section>
  );
}
