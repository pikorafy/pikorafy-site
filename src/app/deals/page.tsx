import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Best SaaS & AI Tool Deals - Pikorafy",
  description:
    "Exclusive discounts on the best SaaS, AI, and productivity tools. Save up to 81% on VPNs, hosting, AI writing tools, and more. Updated March 2026.",
};

type Deal = {
  name: string;
  category: string;
  description: string;
  originalPrice: string | null;
  discountedPrice: string;
  savingsPercent: number | null;
  savingsLabel: string;
  expiry: string;
  href: string;
};

const deals: Deal[] = [
  // VPN & Security
  {
    name: "NordVPN",
    category: "VPN & Security",
    description:
      "Industry-leading VPN with fast servers in 60+ countries. 2-year plan includes threat protection and 3 extra months free.",
    originalPrice: "$11.99/mo",
    discountedPrice: "$3.09/mo",
    savingsPercent: 73,
    savingsLabel: "-73%",
    expiry: "Limited time",
    href: "#",
  },
  {
    name: "Surfshark",
    category: "VPN & Security",
    description:
      "Unlimited-device VPN with CleanWeb ad blocker, split tunneling, and MultiHop. 2-year plan with bonus months included.",
    originalPrice: "$12.95/mo",
    discountedPrice: "$2.19/mo",
    savingsPercent: 81,
    savingsLabel: "-81%",
    expiry: "Limited time",
    href: "#",
  },
  {
    name: "1Password",
    category: "VPN & Security",
    description:
      "Secure password manager with Watchtower breach alerts, travel mode, and family sharing. 25% off your first year.",
    originalPrice: "$2.99/mo",
    discountedPrice: "$2.24/mo",
    savingsPercent: 25,
    savingsLabel: "-25%",
    expiry: "Limited time",
    href: "#",
  },

  // Hosting
  {
    name: "Hostinger",
    category: "Hosting",
    description:
      "Premium web hosting with free domain, SSL, email, and website builder. Ideal for blogs, portfolios, and business sites.",
    originalPrice: "$11.99/mo",
    discountedPrice: "$2.99/mo",
    savingsPercent: 75,
    savingsLabel: "-75%",
    expiry: "Limited time",
    href: "#",
  },
  {
    name: "SiteGround",
    category: "Hosting",
    description:
      "Reliable managed hosting with daily backups, free CDN, and top-rated support. StartUp plan for one website.",
    originalPrice: "$14.99/mo",
    discountedPrice: "$3.99/mo",
    savingsPercent: 73,
    savingsLabel: "-73%",
    expiry: "Limited time",
    href: "#",
  },

  // AI Tools
  {
    name: "Jasper AI",
    category: "AI Tools",
    description:
      "Enterprise-grade AI writing and marketing platform. Generate blog posts, ads, emails, and more with brand voice control.",
    originalPrice: "$49/mo",
    discountedPrice: "$39/mo",
    savingsPercent: 20,
    savingsLabel: "-20%",
    expiry: "Limited time",
    href: "#",
  },
  {
    name: "Copy.ai",
    category: "AI Tools",
    description:
      "AI-powered copywriting tool with 90+ templates for ads, product descriptions, and social media. Free tier available.",
    originalPrice: "$59/mo",
    discountedPrice: "$49/mo",
    savingsPercent: 17,
    savingsLabel: "-17%",
    expiry: "Limited time",
    href: "#",
  },

  // Productivity
  {
    name: "Notion",
    category: "Productivity",
    description:
      "All-in-one workspace for notes, docs, wikis, and project management. Free for personal use with unlimited pages.",
    originalPrice: null,
    discountedPrice: "$8/user/mo",
    savingsPercent: null,
    savingsLabel: "FREE PLAN",
    expiry: "Limited time",
    href: "#",
  },
  {
    name: "Canva Pro",
    category: "Productivity",
    description:
      "Professional design tool with premium templates, brand kits, background remover, and Magic Resize. Try free for 30 days.",
    originalPrice: null,
    discountedPrice: "$12.99/mo",
    savingsPercent: null,
    savingsLabel: "FREE TRIAL",
    expiry: "Limited time",
    href: "#",
  },

  // Gaming
  {
    name: "Instant Gaming",
    category: "Gaming",
    description:
      "Buy PC, Xbox, PlayStation, and Nintendo game keys at up to 90% off retail prices. Trusted marketplace with instant delivery.",
    originalPrice: null,
    discountedPrice: "Up to 90% off",
    savingsPercent: 90,
    savingsLabel: "UP TO -90%",
    expiry: "Always available",
    href: "https://www.instant-gaming.com/?igr=pikorafy",
  },

  // Design
  {
    name: "Figma",
    category: "Design",
    description:
      "Collaborative interface design tool with prototyping, dev mode, and design systems. Free tier for up to 3 projects.",
    originalPrice: null,
    discountedPrice: "$12/editor/mo",
    savingsPercent: null,
    savingsLabel: "FREE TIER",
    expiry: "Limited time",
    href: "#",
  },
];

const categories = [
  "All",
  ...Array.from(new Set(deals.map((d) => d.category))),
];

export default function DealsPage() {
  return (
    <div className="bg-[#0f1117] min-h-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[#2a2e3a]">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Best SaaS &amp; AI Tool Deals
            </h1>
            <p className="mt-6 text-lg text-[#8b8fa3] leading-relaxed">
              Hand-picked discounts on VPNs, hosting, AI tools, and
              productivity software. We negotiate and curate the best prices so
              you don&apos;t have to.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12 sm:py-16">
        {/* Category Filter Chips */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat, i) => (
            <span
              key={cat}
              className={
                i === 0
                  ? "inline-flex rounded-lg bg-[#3B82F6] px-3 py-1.5 text-xs font-medium text-white cursor-pointer"
                  : "inline-flex rounded-lg border border-[#2a2e3a] bg-[#1a1d27] px-3 py-1.5 text-xs font-medium text-[#8b8fa3] transition-colors hover:border-[#3B82F6]/50 hover:text-white cursor-pointer"
              }
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Deals Grid */}
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {deals.map((deal) => (
            <a
              key={deal.name}
              href={deal.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex flex-col rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-6 transition-all hover:border-[#3B82F6]/50 hover:bg-[#1e2231]"
            >
              {/* Discount badge in corner */}
              <div
                className={`absolute -top-2.5 right-4 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                  deal.savingsPercent
                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                    : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                }`}
              >
                {deal.savingsLabel}
              </div>

              {/* Category badge */}
              <div>
                <span className="inline-flex rounded-md bg-[#3B82F6]/10 px-2 py-0.5 text-xs font-medium text-[#3B82F6]">
                  {deal.category}
                </span>
              </div>

              {/* Tool name */}
              <h3 className="mt-4 text-lg font-semibold text-white group-hover:text-[#3B82F6] transition-colors">
                {deal.name}
              </h3>

              {/* Description */}
              <p className="mt-2 flex-1 text-sm text-[#8b8fa3] leading-relaxed">
                {deal.description}
              </p>

              {/* Pricing */}
              <div className="mt-4 flex items-baseline gap-2 flex-wrap">
                {deal.originalPrice && (
                  <span className="text-sm text-[#8b8fa3] line-through">
                    {deal.originalPrice}
                  </span>
                )}
                <span className="text-xl font-bold text-white">
                  {deal.discountedPrice}
                </span>
              </div>

              {/* Expiry label */}
              <p className="mt-2 text-xs text-[#8b8fa3]">{deal.expiry}</p>

              {/* CTA Button */}
              <span className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#3B82F6] px-4 py-2.5 text-sm font-semibold text-white transition-colors group-hover:bg-[#2563EB]">
                Get Deal
                <svg
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </span>
            </a>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-16 rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-6">
          <p className="text-sm text-[#8b8fa3]">
            Prices may vary. Last updated March 2026. Some links are affiliate
            links.
          </p>
        </div>
      </div>
    </div>
  );
}
