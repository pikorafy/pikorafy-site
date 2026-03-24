import { ImageResponse } from "next/og";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getComparisonBySlug, getComparisonSlugs } from "@/lib/comparisons";

export const alt = "Comparison";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export function generateStaticParams() {
  return getComparisonSlugs().map((slug) => ({ slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // If a static OG image exists, serve it directly
  const staticPath = join(process.cwd(), "public", "og", `${slug}.png`);
  if (existsSync(staticPath)) {
    const imageData = await readFile(staticPath);
    return new Response(imageData, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  // Otherwise generate a dynamic OG image
  const comparison = getComparisonBySlug(slug);
  const toolA = comparison?.frontmatter.toolA ?? "Tool A";
  const toolB = comparison?.frontmatter.toolB ?? "Tool B";
  const category = comparison?.frontmatter.category ?? "Comparison";

  return new ImageResponse(
    (
      <div
        style={{
          background: "#0f1117",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Background gradient accents */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "rgba(59, 130, 246, 0.08)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-80px",
            left: "-80px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "rgba(139, 92, 246, 0.08)",
            display: "flex",
          }}
        />

        {/* Category badge */}
        <div
          style={{
            display: "flex",
            background: "rgba(59, 130, 246, 0.1)",
            border: "1px solid rgba(59, 130, 246, 0.2)",
            borderRadius: "8px",
            padding: "8px 20px",
            fontSize: 20,
            color: "#3B82F6",
            marginBottom: "40px",
          }}
        >
          {category}
        </div>

        {/* VS layout */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "48px",
          }}
        >
          {/* Tool A */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "24px",
                background: "#1a1d27",
                border: "1px solid #2a2e3a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 40,
                color: "#e4e6eb",
              }}
            >
              {toolA.charAt(0)}
            </div>
            <span
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: "#e4e6eb",
              }}
            >
              {toolA}
            </span>
          </div>

          {/* VS badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "rgba(59, 130, 246, 0.1)",
              border: "2px solid rgba(59, 130, 246, 0.3)",
            }}
          >
            <span
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: "#60A5FA",
              }}
            >
              VS
            </span>
          </div>

          {/* Tool B */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "24px",
                background: "#1a1d27",
                border: "1px solid #2a2e3a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 40,
                color: "#e4e6eb",
              }}
            >
              {toolB.charAt(0)}
            </div>
            <span
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: "#e4e6eb",
              }}
            >
              {toolB}
            </span>
          </div>
        </div>

        {/* Branding */}
        <div
          style={{
            position: "absolute",
            bottom: "32px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              fontSize: 20,
              color: "#8b8fa3",
            }}
          >
            pikorafy.com
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
