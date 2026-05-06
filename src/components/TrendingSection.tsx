import Image from "next/image";
import Link from "next/link";
import { getDeals, getSteamCoverUrl, getDealUrl } from "@/lib/cheapshark";

export default async function TrendingSection() {
  const deals = await getDeals({ sortBy: "Deal Rating", metacritic: 70, pageSize: 6 });
  if (!deals.length) return null;

  return (
    <section className="section" style={{ borderTop: "1px solid var(--line)" }}>
      <div className="shell">
        <div className="section-hd">
          <div>
            <div className="eyebrow">Trending · right now</div>
            <h2 className="h2">
              Everyone is watching<br /><em>these.</em>
            </h2>
          </div>
          <Link href="/deals" className="btn btn-ghost">See all →</Link>
        </div>
        <div className="cards">
          {deals.slice(0, 6).map((deal) => {
            const cover = getSteamCoverUrl(deal.steamAppID);
            const disc = Math.round(parseFloat(deal.savings));
            return (
              <a
                key={deal.dealID}
                href={getDealUrl(deal.dealID)}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="card boxart"
              >
                <div className="cover">
                  {cover ? (
                    <Image
                      src={cover}
                      alt={deal.title}
                      fill
                      style={{ objectFit: "cover" }}
                      sizes="(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 16vw"
                      unoptimized
                    />
                  ) : (
                    <div style={{ background: `hsl(${(parseInt(deal.gameID, 10) * 37) % 360},38%,22%)`, width: "100%", height: "100%" }} />
                  )}
                  {disc > 0 && <div className="disc-tag">-{disc}%</div>}
                </div>
                <div className="body">
                  <div
                    className="title"
                    style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                  >
                    {deal.title}
                  </div>
                  <div className="meta">
                    {parseInt(deal.metacriticScore) > 0 && (
                      <span>MC {deal.metacriticScore}</span>
                    )}
                    {deal.steamRatingText && <span>{deal.steamRatingText}</span>}
                  </div>
                  <div className="prices">
                    <div>
                      <div className="was">${deal.normalPrice}</div>
                      <div className="now">${parseFloat(deal.salePrice).toFixed(2)}</div>
                    </div>
                    <div className="stores">
                      Best of <b>{deal.storeID ? "8" : "4"}</b> stores
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
