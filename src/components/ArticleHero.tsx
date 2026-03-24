/**
 * Category-themed gradient hero banner for articles.
 * Renders a decorative banner above article content with
 * an abstract pattern based on the category.
 */

const CATEGORY_THEMES: Record<string, { from: string; to: string; accent: string }> = {
  AI: { from: "#3B82F6", to: "#8B5CF6", accent: "#60A5FA" },
  Productivity: { from: "#10B981", to: "#3B82F6", accent: "#34D399" },
  Security: { from: "#EF4444", to: "#F97316", accent: "#F87171" },
  Design: { from: "#EC4899", to: "#8B5CF6", accent: "#F472B6" },
  Development: { from: "#06B6D4", to: "#3B82F6", accent: "#22D3EE" },
  Hosting: { from: "#F97316", to: "#EAB308", accent: "#FB923C" },
  Marketing: { from: "#8B5CF6", to: "#EC4899", accent: "#A78BFA" },
  "Cloud Storage": { from: "#3B82F6", to: "#06B6D4", accent: "#60A5FA" },
  Communication: { from: "#6366F1", to: "#3B82F6", accent: "#818CF8" },
  VPN: { from: "#10B981", to: "#059669", accent: "#34D399" },
};

const DEFAULT_THEME = { from: "#3B82F6", to: "#6366F1", accent: "#60A5FA" };

type ArticleHeroProps = {
  category: string;
  title: string;
};

export default function ArticleHero({ category, title }: ArticleHeroProps) {
  const theme = CATEGORY_THEMES[category] || DEFAULT_THEME;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-[#2a2e3a] mb-8"
      style={{ height: 200 }}
    >
      {/* Gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${theme.from}15 0%, ${theme.to}15 100%)`,
        }}
      />

      {/* Abstract decorative circles */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <circle
          cx="85%"
          cy="20%"
          r="120"
          fill="none"
          stroke={theme.from}
          strokeWidth="1"
          opacity="0.2"
        />
        <circle
          cx="90%"
          cy="30%"
          r="80"
          fill="none"
          stroke={theme.accent}
          strokeWidth="1"
          opacity="0.15"
        />
        <circle
          cx="10%"
          cy="80%"
          r="100"
          fill="none"
          stroke={theme.to}
          strokeWidth="1"
          opacity="0.15"
        />
        <circle
          cx="50%"
          cy="50%"
          r="200"
          fill="none"
          stroke={theme.from}
          strokeWidth="0.5"
          opacity="0.1"
        />
        {/* Dotted grid */}
        <pattern id={`dots-${category}`} x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill={theme.accent} opacity="0.1" />
        </pattern>
        <rect width="100%" height="100%" fill={`url(#dots-${category})`} />
      </svg>

      {/* Category label */}
      <div className="absolute bottom-4 left-5 flex items-center gap-3">
        <span
          className="inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wide uppercase"
          style={{
            backgroundColor: `${theme.from}20`,
            color: theme.accent,
            border: `1px solid ${theme.from}30`,
          }}
        >
          {category}
        </span>
      </div>

      {/* Decorative glow */}
      <div
        className="absolute -top-20 -right-20 h-40 w-40 rounded-full blur-3xl"
        style={{ backgroundColor: theme.from, opacity: 0.08 }}
      />
      <div
        className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full blur-3xl"
        style={{ backgroundColor: theme.to, opacity: 0.06 }}
      />
    </div>
  );
}
