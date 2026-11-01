// Side machinery for the Steampunk theme: pipes, gears, gauges and glass tubes in the margins
// of wide screens. Pure decoration (hidden from screen readers); shown only by
// src/app/themes/steampunk.css, which also mirrors the right side.

function Side({ side }: { side: "left" | "right" }) {
  return (
    <div className={`sp-side sp-${side}`}>
      <span className="sp-pipe" />
      <span className="sp-pipe-2" />
      <span className="sp-flange" style={{ top: "18%" }} />
      <span className="sp-flange" style={{ top: "63%" }} />
      <span className="sp-gear" style={{ top: "9%", left: "calc(42% - 38px)" }} />
      <span className="sp-gear small" style={{ top: "calc(9% + 70px)", left: "calc(42% + 40px)" }} />
      <span className="sp-gauge" style={{ top: "34%", left: "calc(68% - 26px)" }} />
      <span className={`sp-tube${side === "right" ? " teal" : ""}`} style={{ top: "47%", left: "calc(42% - 50px)" }} />
      <span className="sp-gear" style={{ top: "74%", left: "calc(68% - 38px)" }} />
      <span className="sp-gauge" style={{ top: "84%", left: "calc(42% - 26px)" }} />
    </div>
  );
}

export default function SteampunkDecor() {
  return (
    <div className="sp-decor" aria-hidden="true">
      <Side side="left" />
      <Side side="right" />
    </div>
  );
}
