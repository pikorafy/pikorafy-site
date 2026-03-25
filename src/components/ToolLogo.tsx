/* eslint-disable @next/next/no-img-element */

/**
 * Renders a tool/brand logo using the Simple Icons CDN.
 * Falls back to a styled initial letter if the icon isn't found.
 */

const SLUG_MAP: Record<string, string> = {
  // AI tools
  chatgpt: "_openai",
  openai: "_openai",
  claude: "anthropic",
  anthropic: "anthropic",
  gemini: "googlegemini",
  "google gemini": "googlegemini",
  "github copilot": "githubcopilot",
  copilot: "githubcopilot",
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
  clickup: "clickup",
  trello: "trello",
  asana: "asana",
  linear: "linear",
  jira: "jira",
  "monday.com": "_monday",
  monday: "_monday",
  airtable: "airtable",
  slack: "_slack",
  teams: "_msteams",
  "microsoft teams": "_msteams",
  zoom: "zoom",
  "google docs": "googledocs",
  "google meet": "googlemeet",
  "google drive": "googledrive",
  "google sheets": "googlesheets",
  hubspot: "hubspot",

  // Design
  figma: "figma",
  canva: "_canva",
  "adobe xd": "_adobe",
  "adobe express": "_adobe",
  adobe: "_adobe",

  // Hosting & Dev
  vercel: "vercel",
  netlify: "netlify",
  hostinger: "hostinger",
  siteground: "_siteground",
  wordpress: "wordpress",
  wix: "wix",
  squarespace: "squarespace",
  heroku: "heroku",
  digitalocean: "digitalocean",
  aws: "amazonaws",
  cloudflare: "cloudflare",

  // Security
  "1password": "1password",
  bitwarden: "bitwarden",
  nordvpn: "nordvpn",
  surfshark: "surfshark",
  expressvpn: "expressvpn",
  lastpass: "lastpass",
  protonvpn: "protonvpn",

  // Email & Marketing
  mailchimp: "mailchimp",
  convertkit: "kit",
  substack: "substack",
  buttondown: "buttondown",

  // Cloud & Storage
  dropbox: "dropbox",
  "google cloud": "googlecloud",
  "icloud": "icloud",
  "onedrive": "microsoftonedrive",

  // Gaming
  "xbox game pass": "_xbox",
  "ps plus": "playstation",
  playstation: "playstation",
  xbox: "_xbox",
  "geforce now": "nvidia",
  nvidia: "nvidia",
  steam: "steam",

  // Communication
  discord: "discord",
  "discord nitro": "discord",
  telegram: "telegram",
  "telegram premium": "telegram",
  whatsapp: "whatsapp",

  // Dev tools
  github: "github",
  gitlab: "gitlab",
  vscode: "visualstudiocode",
  "visual studio code": "visualstudiocode",
  docker: "docker",
  postman: "postman",
};

// Inline SVGs for brands not on Simple Icons CDN
const INLINE_SVGS: Record<string, string> = {
  _canva: `<svg viewBox="0 0 24 24" fill="#e4e6eb"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.195 14.338c-.413 1.504-1.53 2.756-2.98 3.378-1.473.633-3.136.67-4.545.154-2.377-.87-3.863-3.393-3.393-6.046.31-1.748 1.435-3.14 2.922-3.783a4.39 4.39 0 0 1 1.74-.36c.94 0 1.777.34 2.286.998.37.478.503 1.072.37 1.636-.19.805-.923 1.26-1.564 1.072-.262-.077-.455-.286-.505-.548-.05-.263.017-.545.18-.743.197-.24.2-.56.007-.773-.264-.292-.737-.382-1.2-.254-.848.233-1.566.91-1.899 1.81-.45 1.217-.196 2.652.637 3.523.59.617 1.4.897 2.234.803 1.13-.128 2.123-.882 2.584-1.903.134-.296.464-.464.787-.38.34.088.545.41.478.75z"/></svg>`,
  _adobe: `<svg viewBox="0 0 24 24" fill="#e4e6eb"><path d="M13.966 22.624l-1.69-4.281H8.122l3.892-9.144 5.662 13.425zM8.884 1.376H0v21.248zm6.232 0H24v21.248z"/></svg>`,
  _siteground: `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#e4e6eb" stroke-width="1.5"/><text x="12" y="16" text-anchor="middle" font-size="10" font-weight="bold" fill="#e4e6eb">SG</text></svg>`,
  _openai: `<svg viewBox="0 0 24 24" fill="#e4e6eb"><path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.998 5.998 0 0 0-3.998 2.9 6.042 6.042 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/></svg>`,
  _slack: `<svg viewBox="0 0 24 24" fill="#e4e6eb"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/></svg>`,
  _xbox: `<svg viewBox="0 0 24 24" fill="#e4e6eb"><path d="M4.102 21.033A11.947 11.947 0 0 0 12 24a11.96 11.96 0 0 0 7.902-2.967c1.877-1.912-4.316-8.709-7.902-11.417-3.582 2.708-9.779 9.505-7.898 11.417zm11.16-14.406c2.5 2.961 7.484 9.578 5.252 12.12A11.933 11.933 0 0 0 24 12c0-4.074-2.018-7.668-5.113-9.844-.627-.371-1.627-.555-2.559.078-.585.398-1.066.805-1.066.805s1.145 1.138 2 2.588zM3.847 15.614C2.312 12.998.842 10.554.375 9.293A11.922 11.922 0 0 0 0 12c0 2.524.781 4.867 2.113 6.801 1.117 1.57 2.535.834 3.543-.18a64.268 64.268 0 0 0-1.809-3.007zM12 3.735S10.699 2.86 9.506 2.32C8.578 1.893 7.39 1.555 6.39 2.199A11.94 11.94 0 0 1 12 0c2.125 0 4.122.554 5.859 1.527a.585.585 0 0 1 .128.075c-.054.027-.107.05-.16.078-1.072.516-2.27 1.238-3.387 1.981L12 5.078l-2.44-1.343L12 3.735z"/></svg>`,
  _monday: `<svg viewBox="0 0 24 24" fill="#e4e6eb"><path d="M4.768 15.424c-1.32 0-2.392-1.044-2.392-2.33 0-.478.152-.95.44-1.344L8.26 4.058c.5-.718 1.487-.918 2.224-.447.85.54 1.08 1.66.517 2.5l-4.2 6.47a2.42 2.42 0 0 1-2.033 1.1zm7.478 0c-1.32 0-2.392-1.044-2.392-2.33 0-.478.152-.95.44-1.344l5.444-7.692c.5-.718 1.487-.918 2.224-.447.85.54 1.08 1.66.517 2.5l-4.2 6.47a2.42 2.42 0 0 1-2.033 1.1zm7.386.256a2.643 2.643 0 0 1-2.643-2.643 2.643 2.643 0 0 1 2.643-2.643 2.643 2.643 0 0 1 2.643 2.643 2.643 2.643 0 0 1-2.643 2.643z"/></svg>`,
  _msteams: `<svg viewBox="0 0 24 24" fill="#e4e6eb"><path d="M20.625 8.5h-1.5a2.502 2.502 0 0 0 1.875-2.417C21 4.388 19.612 3 17.917 3c-.702 0-1.345.243-1.855.648A4.48 4.48 0 0 0 14.5 2C12.29 2 10.5 3.79 10.5 6s1.79 4 4 4h.09c-.054.328-.09.66-.09 1v5.5c0 .55.45 1 1 1h5.125c1.035 0 1.875-.84 1.875-1.875V10.375c0-1.036-.84-1.875-1.875-1.875zM17.917 4.5c.827 0 1.5.673 1.5 1.5s-.673 1.5-1.5 1.5-1.5-.673-1.5-1.5.673-1.5 1.5-1.5zM14.5 8.5c-1.378 0-2.5-1.122-2.5-2.5s1.122-2.5 2.5-2.5S17 4.622 17 6s-1.122 2.5-2.5 2.5zm-5 3V17c0 1.65 1.35 3 3 3h4.35c-.423 1.17-1.542 2-2.85 2H7c-1.65 0-3-1.35-3-3v-5c0-1.308.83-2.427 2-2.85V11c0-.34.03-.672.09-1H5.5c-1.036 0-1.875.84-1.875 1.875v4.75c0 1.036.84 1.875 1.875 1.875H9.5z"/></svg>`,
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

  // Inline SVG for brands not on Simple Icons CDN
  if (slug.startsWith("_")) {
    const svgMarkup = INLINE_SVGS[slug];
    if (svgMarkup) {
      return (
        <span
          className={`inline-flex items-center justify-center rounded-xl bg-[#1a1d27] border border-[#2a2e3a] p-2 ${className}`}
          style={{ width: size + 16, height: size + 16 }}
        >
          <span
            style={{ width: size, height: size, display: "block" }}
            dangerouslySetInnerHTML={{ __html: svgMarkup }}
          />
        </span>
      );
    }
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
