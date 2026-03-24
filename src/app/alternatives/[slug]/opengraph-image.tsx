import { ImageResponse } from "next/og";
import {
  getAlternativeBySlug,
  getAlternativeSlugs,
} from "@/lib/alternatives";

export const alt = "Alternatives";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export function generateStaticParams() {
  return getAlternativeSlugs().map((slug) => ({ slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const alternative = getAlternativeBySlug(slug);
  const toolName = alternative?.frontmatter.toolName ?? "Tool";
  const topAlternatives = alternative?.frontmatter.topAlternatives ?? [];
  const category = alternative?.frontmatter.category ?? "Software";

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
            left: "50%",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "rgba(59, 130, 246, 0.06)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-80px",
            right: "-80px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "rgba(139, 92, 246, 0.06)",
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
            marginBottom: "24px",
          }}
        >
          {category}
        </div>

        {/* Tool icon placeholder */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "20px",
            background: "#1a1d27",
            border: "1px solid #2a2e3a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 36,
            color: "#e4e6eb",
            marginBottom: "20px",
          }}
        >
          {toolName.charAt(0)}
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: "#e4e6eb",
            marginBottom: "36px",
            display: "flex",
          }}
        >
          {toolName} Alternatives
        </div>

        {/* Top alternatives badges */}
        {topAlternatives.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: "16px",
            }}
          >
            {topAlternatives.slice(0, 3).map((alt) => (
              <div
                key={alt}
                style={{
                  display: "flex",
                  background: "#1a1d27",
                  border: "1px solid #2a2e3a",
                  borderRadius: "12px",
                  padding: "12px 28px",
                  fontSize: 22,
                  color: "#8b8fa3",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    background: "rgba(59, 130, 246, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    color: "#60A5FA",
                  }}
                >
                  {alt.charAt(0)}
                </div>
                {alt}
              </div>
            ))}
          </div>
        )}

        {/* Branding */}
        <div
          style={{
            position: "absolute",
            bottom: "32px",
            display: "flex",
            alignItems: "center",
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
