import { ImageResponse } from "next/og";
import { getArticleBySlug, getArticleSlugs } from "@/lib/articles";

export const alt = "Blog article";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export function generateStaticParams() {
  return getArticleSlugs().map((slug) => ({ slug }));
}

const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
  AI: { bg: "rgba(139, 92, 246, 0.1)", border: "rgba(139, 92, 246, 0.2)", text: "#A78BFA" },
  Productivity: { bg: "rgba(16, 185, 129, 0.1)", border: "rgba(16, 185, 129, 0.2)", text: "#34D399" },
  Development: { bg: "rgba(59, 130, 246, 0.1)", border: "rgba(59, 130, 246, 0.2)", text: "#60A5FA" },
  Design: { bg: "rgba(244, 114, 182, 0.1)", border: "rgba(244, 114, 182, 0.2)", text: "#F472B6" },
  Security: { bg: "rgba(245, 158, 11, 0.1)", border: "rgba(245, 158, 11, 0.2)", text: "#FBBF24" },
  Cloud: { bg: "rgba(6, 182, 212, 0.1)", border: "rgba(6, 182, 212, 0.2)", text: "#22D3EE" },
};

const defaultColors = { bg: "rgba(59, 130, 246, 0.1)", border: "rgba(59, 130, 246, 0.2)", text: "#60A5FA" };

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  const title = article?.frontmatter.title ?? "Blog Article";
  const category = article?.frontmatter.category ?? "Article";
  const colors = categoryColors[category] ?? defaultColors;

  return new ImageResponse(
    (
      <div
        style={{
          background: "#0f1117",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          position: "relative",
        }}
      >
        {/* Background gradient accents */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
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
            bottom: "-100px",
            left: "200px",
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
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            borderRadius: "8px",
            padding: "8px 20px",
            fontSize: 22,
            color: colors.text,
            marginBottom: "32px",
          }}
        >
          {category}
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: title.length > 60 ? 44 : 56,
            fontWeight: 700,
            color: "#e4e6eb",
            lineHeight: 1.2,
            maxWidth: "1000px",
            display: "flex",
          }}
        >
          {title}
        </div>

        {/* Bottom bar with branding */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            left: "80px",
            right: "80px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "2px",
              background: colors.text,
              display: "flex",
            }}
          />
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
