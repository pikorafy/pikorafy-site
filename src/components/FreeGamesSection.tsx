import Image from "next/image";
import { getDeals, getSteamCoverUrl, getDealUrl } from "@/lib/cheapshark";

export default async function FreeGamesSection() {
  const deals = await getDeals({ upperPrice: 0, pageSize: 4 });
  const free = deals.slice(0, 2);
  if (!free.length) return null;

  return (
    <section className="section" style={{ borderTop: "1px solid var(--line)" }}>
      <div className="shell">
        <div className="section-hd">
          <div>
            <div className="eyebrow">Free this week · no strings</div>
            <h2 className="h2">
              Free,<br /><em>with no catch.</em>
            </h2>
          </div>
        </div>
        <div className="free-band">
          {free.map((deal) => {
            const cover = getSteamCoverUrl(deal.steamAppID);
            return (
              <a
                key={deal.dealID}
                href={getDealUrl(deal.dealID)}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="freecard"
              >
                <div className="fcover">
                  {cover ? (
                    <Image
                      src={cover}
                      alt={deal.title}
                      width={100}
                      height={130}
                      style={{ objectFit: "cover", width: "100%", height: "100%" }}
                      unoptimized
                    />
                  ) : (
                    <div style={{ background: `hsl(${(parseInt(deal.gameID, 10) * 37) % 360},38%,22%)`, width: "100%", height: "100%" }} />
                  )}
                </div>
                <div>
                  <h4>{deal.title}</h4>
                  {deal.steamRatingText && (
                    <div style={{ fontFamily: "var(--ff-mono)", fontSize: 11, color: "var(--text-3)", marginBottom: 8 }}>
                      {deal.steamRatingText}
                    </div>
                  )}
                  <div className="free-tag">● FREE</div>
                  <div className="endsin">
                    Claim before it&rsquo;s gone
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
