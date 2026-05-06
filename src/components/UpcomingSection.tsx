const UPCOMING = [
  { id: "oneiros-2",     title: "Oneiros II: Reverie",   genre: "RPG",      platforms: ["PC", "PS5", "XBX"], base: 69.99, cheap: 59.49, days: 38, hue: 282 },
  { id: "low-orbit-ltd", title: "Low Orbit, Ltd.",        genre: "Sim",      platforms: ["PC"],               base: 34.99, cheap: 31.49, days: 12, hue: 200 },
  { id: "feral-hymns",   title: "Feral Hymns",           genre: "Adventure", platforms: ["PC", "SW", "PS5"],  base: 29.99, cheap: 26.99, days: 64, hue: 142 },
  { id: "tidewreck",     title: "Tidewreck",             genre: "Survival",  platforms: ["PC", "PS5"],        base: 39.99, cheap: 35.99, days: 21, hue: 188 },
];

function stripes(hue: number) {
  return `repeating-linear-gradient(
    -45deg,
    hsl(${hue},38%,18%) 0px,
    hsl(${hue},38%,18%) 12px,
    hsl(${hue},32%,14%) 12px,
    hsl(${hue},32%,14%) 24px
  )`;
}

export default function UpcomingSection() {
  return (
    <section className="section" style={{ borderTop: "1px solid var(--line)" }}>
      <div className="shell">
        <div className="section-hd">
          <div>
            <div className="eyebrow">Upcoming · pre-order</div>
            <h2 className="h2">
              Lock in day-one before<br /><em>MSRP locks you out.</em>
            </h2>
          </div>
        </div>
        <div className="upcoming-grid">
          {UPCOMING.map((g) => (
            <div key={g.id} className="upcoming-card">
              <div className="ucover" style={{ background: stripes(g.hue) }} />
              <div className="uinfo">
                <div className="countdown">
                  <span>In</span>
                  <b>{g.days}</b>
                  <span>days</span>
                </div>
                <div className="ut">{g.title}</div>
                <div className="um">{g.genre} · {g.platforms.join(" / ")}</div>
                <div className="upre">
                  <div>
                    <div style={{ fontFamily: "var(--ff-mono)", fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      Pre-order from
                    </div>
                    <div className="upr">${g.cheap.toFixed(2)}</div>
                  </div>
                  <div className="ucta">Pre-order →</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
