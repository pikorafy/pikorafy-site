import Image from "next/image";
import Link from "next/link";
import { getDeals, getSteamCoverUrl, getDealUrl, getStoreName } from "@/lib/cheapshark";

export default async function NewReleasesSection() {
  const deals = await getDeals({ sortBy: "Recent", pageSize: 4, onSale: true });
  if (!deals.length) return null;

  return (
    <section className="section" style={{ borderTop: "1px solid var(--line)" }}>
      <div className="shell">
        <div className="section-hd">
          <div>
            <div className="eyebrow">New releases · just dropped</div>
            <h2 className="h2">
              Just shipped,<br /><em>already discounted.</em>
            </h2>
          </div>
          <Link href="/deals?sort=Recent" className="btn btn-ghost">All new →</Link>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
          {deals.slice(0, 4).map((deal) => {
            const cover = getSteamCoverUrl(deal.steamAppID);
            const disc = Math.round(parseFloat(deal.savings));
            const storeName = getStoreName(deal.storeID);
            return (
              <a
                key={deal.dealID}
                href={getDealUrl(deal.dealID)}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="card data"
              >
                <div className="cover">
                  {cover ? (
                    <Image
                      src={cover}
                      alt={deal.title}
                      width={80}
                      height={100}
                      style={{ objectFit: "cover", width: "100%", height: "100%" }}
                      unoptimized
                    />
                  ) : (
                    <div style={{ background: `hsl(${(parseInt(deal.gameID, 10) * 37) % 360},38%,22%)`, width: "100%", height: "100%" }} />
                  )}
                </div>
                <div className="info">
                  <div className="title">{deal.title}</div>
                  <div className="meta">
                    {parseInt(deal.metacriticScore) > 0 && <span>MC {deal.metacriticScore}</span>}
                    {deal.steamRatingText && <span>{deal.steamRatingText}</span>}
                  </div>
                  <div className="stores-mini">
                    <span className="store-pill cheapest">{storeName}</span>
                  </div>
                </div>
                <div className="price-block">
                  {disc > 0 && <span className="disc">-{disc}%</span>}
                  {disc > 0 && <span className="was">${deal.normalPrice}</span>}
                  <span className="now">${parseFloat(deal.salePrice).toFixed(2)}</span>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
