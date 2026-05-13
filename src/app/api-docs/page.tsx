import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pikorafy Store Partner API",
  description:
    "Submit your store's game prices directly to Pikorafy. Free for authorized retailers. Full REST API with authentication, upsert, and expiry support.",
};

function Code({ children }: { children: string }) {
  return (
    <pre style={{
      background: "var(--bg-3)", border: "1px solid var(--line)",
      borderRadius: "var(--r)", padding: "20px 24px",
      fontFamily: "var(--ff-mono)", fontSize: 13, lineHeight: 1.7,
      overflowX: "auto", margin: "16px 0", color: "var(--text)",
    }}>
      <code>{children}</code>
    </pre>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontFamily: "var(--ff-mono)", fontSize: 11, fontWeight: 700,
      padding: "4px 10px", borderRadius: 3, background: color,
      color: "#fff", letterSpacing: "0.08em", textTransform: "uppercase" as const,
      marginRight: 8,
    }}>
      {label}
    </span>
  );
}

function Endpoint({
  method, path, description, params, body, response, auth,
}: {
  method: "GET" | "POST" | "DELETE";
  path: string;
  description: string;
  params?: { name: string; type: string; required: boolean; desc: string }[];
  body?: string;
  response: string;
  auth: boolean;
}) {
  const methodColor = method === "GET" ? "#42a3a6" : method === "POST" ? "#75ce57" : "#e63946";
  return (
    <div style={{ borderTop: "1px solid var(--line)", paddingTop: 40, marginTop: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
        <Badge label={method} color={methodColor} />
        <code style={{ fontFamily: "var(--ff-mono)", fontSize: 16, fontWeight: 600, color: "var(--text)" }}>{path}</code>
        {auth && (
          <span style={{ fontFamily: "var(--ff-mono)", fontSize: 10, color: "var(--warn)", border: "1px solid var(--warn)", borderRadius: 3, padding: "2px 7px" }}>
            🔑 Auth required
          </span>
        )}
      </div>
      <p style={{ color: "var(--text-2)", marginBottom: 20 }}>{description}</p>

      {params && params.length > 0 && (
        <>
          <h4 style={{ fontFamily: "var(--ff-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--text-3)", margin: "0 0 10px" }}>
            Query parameters
          </h4>
          <div style={{ border: "1px solid var(--line)", borderRadius: "var(--r)", overflow: "hidden", marginBottom: 16 }}>
            {params.map((p, i) => (
              <div key={p.name} style={{
                display: "grid", gridTemplateColumns: "130px 70px 60px 1fr",
                gap: 16, padding: "12px 18px", background: i % 2 === 0 ? "var(--bg-elev)" : "var(--bg-3)",
                fontFamily: "var(--ff-mono)", fontSize: 12, alignItems: "center",
              }}>
                <code style={{ color: "var(--text)", fontWeight: 600 }}>{p.name}</code>
                <span style={{ color: "var(--accent-2)" }}>{p.type}</span>
                <span style={{ color: p.required ? "var(--punch)" : "var(--text-3)" }}>{p.required ? "required" : "optional"}</span>
                <span style={{ color: "var(--text-2)", fontFamily: "var(--ff-body)" }}>{p.desc}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {body && (
        <>
          <h4 style={{ fontFamily: "var(--ff-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--text-3)", margin: "0 0 6px" }}>
            Request body
          </h4>
          <Code>{body}</Code>
        </>
      )}

      <h4 style={{ fontFamily: "var(--ff-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--text-3)", margin: "0 0 6px" }}>
        Response
      </h4>
      <Code>{response}</Code>
    </div>
  );
}

export default function ApiDocsPage() {
  return (
    <div style={{ background: "var(--bg)" }}>
      {/* Hero */}
      <section className="stores-hero">
        <div className="shell">
          <div className="eyebrow">API · store partner integration</div>
          <h1>List your prices.<br /><em>Reach every buyer.</em></h1>
          <p className="lede">
            Pikorafy&rsquo;s Store Partner API lets authorized retailers submit real-time game prices
            directly. Your offers appear in our comparison engine next to Steam, GOG, and every major
            store — sorted by trust score, never by who paid the most.
          </p>
          <div className="stat-row">
            <div><div className="v">REST</div><div className="l">Protocol</div></div>
            <div><div className="v">Free</div><div className="l">For partners</div></div>
            <div><div className="v">500</div><div className="l">Prices / request</div></div>
            <div><div className="v">60s</div><div className="l">Cache TTL</div></div>
          </div>
        </div>
      </section>

      <div className="shell" style={{ paddingBottom: "var(--pad-sec)" }}>

        {/* Base URL */}
        <section style={{ paddingTop: "var(--pad-sec)" }}>
          <div className="eyebrow">Base URL</div>
          <Code>https://pikorafy.com/api/v1</Code>

          <div className="eyebrow" style={{ marginTop: 32 }}>Authentication</div>
          <p style={{ color: "var(--text-2)", margin: "8px 0 0" }}>
            Authenticated endpoints require your store&rsquo;s API key in the <code style={{ fontFamily: "var(--ff-mono)", background: "var(--bg-3)", padding: "2px 6px", borderRadius: 3 }}>Authorization</code> header:
          </p>
          <Code>{`Authorization: Bearer YOUR_API_KEY`}</Code>
          <p style={{ color: "var(--text-2)" }}>
            API keys are issued after we audit your store. <Link href="/api-docs#apply" style={{ color: "var(--accent-2)" }}>Apply below →</Link>
          </p>
        </section>

        {/* Endpoints */}
        <section>
          <h2 className="h2" style={{ marginTop: "var(--pad-sec)" }}>Endpoints</h2>

          <Endpoint
            method="GET"
            path="/api/v1/prices"
            auth={false}
            description="Retrieve all current store offers for a game. Returns prices sorted cheapest first, from active partner stores only. Expired listings are automatically excluded."
            params={[
              { name: "steamId",  type: "string",  required: true,  desc: "Steam App ID of the game (e.g. 730 for CS2)" },
              { name: "region",   type: "string",  required: false, desc: "Filter by region: Global, EU, US, RoW" },
              { name: "edition",  type: "string",  required: false, desc: "Filter by edition: Standard, Deluxe, Premium" },
              { name: "currency", type: "string",  required: false, desc: "Currency code (default: USD)" },
            ]}
            response={`{
  "steamId": "730",
  "count": 3,
  "currency": "USD",
  "prices": [
    {
      "store": {
        "id":    "uuid",
        "name":  "Fanatical",
        "short": "FNT",
        "url":   "https://www.fanatical.com",
        "trust": 94
      },
      "salePrice":   11.99,
      "normalPrice": 19.99,
      "savings":     40,
      "currency":    "USD",
      "dealUrl":     "https://www.fanatical.com/game/cs2",
      "edition":     "Standard",
      "region":      "Global",
      "drm":         "Steam Key",
      "updatedAt":   "2026-05-13T10:00:00Z",
      "expiresAt":   null
    }
  ]
}`}
          />

          <Endpoint
            method="POST"
            path="/api/v1/prices"
            auth={true}
            description="Submit or update your store's price listings. Accepts up to 500 prices per request. Existing listings for the same (steamAppId + edition + region) combination are automatically updated (upsert)."
            body={`{
  "prices": [
    {
      "steamAppId":   "730",           // required — Steam App ID
      "gameTitle":    "Counter-Strike 2",  // required
      "salePrice":    11.99,           // required — current sale price
      "normalPrice":  19.99,           // required — full MSRP
      "dealUrl":      "https://yourstore.com/cs2",  // required
      "edition":      "Standard",      // optional, default "Standard"
      "region":       "Global",        // optional, default "Global"
      "drm":          "Steam Key",     // optional, default "Steam Key"
      "currency":     "USD",           // optional, default "USD"
      "expiresAt":    "2026-06-01"     // optional — ISO 8601 date
    }
  ]
}`}
            response={`{
  "accepted": 1,
  "rejected": 0,
  "errors":   []
}`}
          />

          <Endpoint
            method="DELETE"
            path="/api/v1/prices"
            auth={true}
            description="Remove your store's listings. Pass steamId to remove a single game, or omit it to remove all of your listings (full wipe)."
            params={[
              { name: "steamId", type: "string", required: false, desc: "Steam App ID to remove. Omit to remove all your listings." },
            ]}
            response={`// Single game
{ "deleted": 2, "steamId": "730" }

// Full wipe (no steamId param)
{ "deleted": 847, "steamId": "all" }`}
          />
        </section>

        {/* Error codes */}
        <section style={{ marginTop: "var(--pad-sec)" }}>
          <h2 className="h2">Error codes</h2>
          <div style={{ border: "1px solid var(--line)", borderRadius: "var(--r)", overflow: "hidden", marginTop: 20 }}>
            {[
              ["400", "Bad Request",   "Missing or invalid parameters"],
              ["401", "Unauthorized",  "Missing or invalid API key"],
              ["422", "Unprocessable", "All submitted prices failed validation"],
              ["429", "Rate limited",  "Too many requests — back off and retry"],
              ["500", "Server error",  "Database or internal error; try again"],
            ].map(([code, title, desc], i) => (
              <div key={code} style={{
                display: "grid", gridTemplateColumns: "60px 160px 1fr",
                gap: 20, padding: "14px 20px", alignItems: "center",
                background: i % 2 === 0 ? "var(--bg-elev)" : "var(--bg-3)",
                fontFamily: "var(--ff-mono)", fontSize: 13,
              }}>
                <span style={{ color: parseInt(code) >= 500 ? "var(--punch)" : parseInt(code) >= 400 ? "var(--warn)" : "var(--good)", fontWeight: 700 }}>{code}</span>
                <span style={{ color: "var(--text)" }}>{title}</span>
                <span style={{ color: "var(--text-2)", fontFamily: "var(--ff-body)" }}>{desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Rate limits */}
        <section style={{ marginTop: "var(--pad-sec)" }}>
          <h2 className="h2">Rate limits</h2>
          <p style={{ color: "var(--text-2)", marginTop: 12 }}>
            Partner API keys have generous limits suitable for bulk price updates:
          </p>
          <div className="ranking-explainer" style={{ marginTop: 20 }}>
            <div>
              <div className="num">500</div>
              <h4>Prices per POST</h4>
              <p>Submit up to 500 game prices in a single request. Batch your updates for efficiency.</p>
            </div>
            <div>
              <div className="num">60s</div>
              <h4>Cache TTL</h4>
              <p>GET responses are cached for 60 seconds. Prices are effectively live for end users.</p>
            </div>
            <div>
              <div className="num">Upsert</div>
              <h4>No duplicates</h4>
              <p>Re-posting the same (steamId + edition + region) updates rather than creating duplicates.</p>
            </div>
            <div>
              <div className="num">Free</div>
              <h4>For partners</h4>
              <p>The API is completely free for authorized store partners. No tiers, no billing.</p>
            </div>
          </div>
        </section>

        {/* Quick start */}
        <section style={{ marginTop: "var(--pad-sec)" }}>
          <h2 className="h2">Quick start</h2>
          <p style={{ color: "var(--text-2)", marginTop: 12, marginBottom: 4 }}>Submit a price with curl:</p>
          <Code>{`curl -X POST https://pikorafy.com/api/v1/prices \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prices": [{
      "steamAppId":  "730",
      "gameTitle":   "Counter-Strike 2",
      "salePrice":   11.99,
      "normalPrice": 19.99,
      "dealUrl":     "https://yourstore.com/cs2",
      "edition":     "Standard",
      "region":      "Global"
    }]
  }'`}</Code>

          <p style={{ color: "var(--text-2)", marginBottom: 4 }}>Read prices for a game (no auth needed):</p>
          <Code>{`curl "https://pikorafy.com/api/v1/prices?steamId=730&region=Global"`}</Code>
        </section>

        {/* Apply section */}
        <section id="apply" style={{ marginTop: "var(--pad-sec)" }}>
          <div style={{
            background: "var(--bg-elev)", border: "1px solid var(--line)",
            borderRadius: "var(--r-lg)", padding: 40,
            display: "grid", gridTemplateColumns: "1fr auto", gap: 32, alignItems: "center",
          }}>
            <div>
              <div className="eyebrow">Get access</div>
              <h3 style={{ fontFamily: "var(--ff-display)", fontSize: 26, fontWeight: 700, margin: "8px 0 10px", letterSpacing: "-0.02em" }}>
                Apply for a partner API key.
              </h3>
              <p style={{ color: "var(--text-2)", margin: 0, maxWidth: "60ch" }}>
                We audit every store before issuing a key — chargeback rate, refund policy, licensing.
                The process takes about three weeks and ends with a public trust score. Once approved,
                your prices appear in Pikorafy&rsquo;s comparison engine immediately on submission.
              </p>
              <div style={{ display: "flex", gap: 16, marginTop: 16, fontFamily: "var(--ff-mono)", fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                <span>✓ Free for authorized retailers</span>
                <span>✓ No revenue share</span>
                <span>✓ Trust score published</span>
              </div>
            </div>
            <a
              href="mailto:partners@pikorafy.com?subject=Store+Partner+API+Application"
              className="btn btn-primary"
              style={{ padding: "14px 24px", whiteSpace: "nowrap" }}
            >
              Apply by email →
            </a>
          </div>
        </section>

      </div>
    </div>
  );
}
