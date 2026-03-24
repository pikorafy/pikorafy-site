/* eslint-disable @next/next/no-img-element */

/**
 * Renders a tool/brand logo using the Simple Icons CDN.
 * Falls back to a styled initial letter if the icon isn't found.
 */

const SLUG_MAP: Record<string, string> = {
  // AI tools
  chatgpt: "openai",
  claude: "anthropic",
  gemini: "google",
  "github copilot": "github",
  copilot: "github",
  cursor: "cursor",
  midjourney: "midjourney",
  "dall-e": "openai",
  perplexity: "perplexity",
  jasper: "jasper",
  grammarly: "grammarly",

  // Productivity
  notion: "notion",
  obsidian: "obsidian",
  coda: "coda",
  trello: "trello",
  asana: "asana",
  linear: "linear",
  slack: "slack",
  teams: "microsoftteams",
  "microsoft teams": "microsoftteams",
  zoom: "zoom",
  "google docs": "googledocs",

  // Design
  figma: "figma",
  canva: "canva",
  "adobe xd": "adobexd",

  // Hosting & Dev
  vercel: "vercel",
  netlify: "netlify",
  hostinger: "hostinger",
  siteground: "siteground",
  wordpress: "wordpress",
  wix: "wix",
  squarespace: "squarespace",

  // Security
  "1password": "1password",
  bitwarden: "bitwarden",
  nordvpn: "nordvpn",
  surfshark: "surfshark",
  expressvpn: "expressvpn",

  // Email & Marketing
  mailchimp: "mailchimp",
  convertkit: "convertkit",

  // Cloud
  dropbox: "dropbox",
  "google drive": "googledrive",
};

type ToolLogoProps = {
  name: string;
  size?: number;
  className?: string;
};

export default function ToolLogo({ name, size = 32, className = "" }: ToolLogoProps) {
  const key = name.toLowerCase().trim();
  const slug = SLUG_MAP[key];

  if (!slug) {
    // Fallback: styled initial
    return (
      <span
        className={`inline-flex items-center justify-center rounded-xl bg-[#1a1d27] border border-[#2a2e3a] font-bold text-[#e4e6eb] ${className}`}
        style={{ width: size + 16, height: size + 16, fontSize: size * 0.5 }}
      >
        {name.charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl bg-[#1a1d27] border border-[#2a2e3a] p-2 ${className}`}
      style={{ width: size + 16, height: size + 16 }}
    >
      <img
        src={`https://cdn.simpleicons.org/${slug}/e4e6eb`}
        alt={`${name} logo`}
        width={size}
        height={size}
        loading="eager"
      />
    </span>
  );
}
