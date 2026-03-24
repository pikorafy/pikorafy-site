import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Best SaaS & AI Tool Deals - Pikorafy",
  description:
    "Exclusive discounts and deals on the best SaaS, AI, and productivity tools. Save up to 86% on NordVPN, Surfshark, Hostinger, Grammarly, and more.",
};

const deals = [
  {
    name: "NordVPN",
    category: "Security",
    description:
      "Industry-leading VPN with 73% off the 2-year plan plus 3 extra months free. Fast servers in 60+ countries with threat protection included.",
    originalPrice: "$11.99/mo",
    discountedPrice: "$3.09/mo",
    discountPercent: "73% OFF",
    extra: "+ 3 months free",
    url: "https://pikorafy.com/go/nordvpn",
    expiration: "Limited time offer",
    featured: true,
  },
  {
    name: "Surfshark",
    category: "Security",
    description:
      "Unlimited device VPN with 86% savings on the 2-year plan plus 4 months free. CleanWeb ad blocker and split tunneling included.",
    originalPrice: "$13.99/mo",
    discountedPrice: "$1.99/mo",
    discountPercent: "86% OFF",
    extra: "+ 4 months free",
    url: "https://pikorafy.com/go/surfshark",
    expiration: "Limited time offer",
    featured: false,
  },
  {
    name: "Hostinger",
    category: "Hosting",
    description:
      "Premium web hosting with 75% off. Includes free domain, SSL, email, and a website builder. Perfect for blogs and business sites.",
    originalPrice: "$11.99/mo",
    discountedPrice: "$2.99/mo",
    discountPercent: "75% OFF",
    extra: null,
    url: "https://pikorafy.com/go/hostinger",
    expiration: "Limited time offer",
    featured: false,
  },
  {
    name: "Canva Pro",
    category: "Design",
    description:
      "Professional design tool with premium templates, brand kits, background remover, and Magic Resize. Start with a 30-day free trial.",
    originalPrice: null,
    discountedPrice: "$12.99/mo",
    discountPercent: "FREE TRIAL",
    extra: "30-day free trial for teams",
    url: "https://pikorafy.com/go/canva",
    expiration: "Ongoing offer",
    featured: false,
  },
  {
    name: "Notion",
    category: "Productivity",
    description:
      "All-in-one workspace for notes, docs, wikis, and project management. Free for personal use with unlimited pages and blocks.",
    originalPrice: null,
    discountedPrice: "$8/mo",
    discountPercent: "FREE PLAN",
    extra: "Free for personal use",
    url: "https://pikorafy.com/go/notion",
    expiration: "Ongoing offer",
    featured: false,
  },
  {
    name: "Grammarly",
    category: "AI Writing",
    description:
      "AI-powered writing assistant with tone detection, plagiarism checker, and style suggestions. 40% off the annual Premium plan.",
    originalPrice: "$12/mo",
    discountedPrice: "$8/mo",
    discountPercent: "40% OFF",
    extra: "Annual plan",
    url: "https://pikorafy.com/go/grammarly",
    expiration: "Limited time offer",
    featured: false,
  },
  {
    name: "NordPass",
    category: "Security",
    description:
      "Secure password manager with autofill, password health reports, and data breach scanning. 60% off the premium plan.",
    originalPrice: "$3.29/mo",
    discountedPrice: "$1.29/mo",
    discountPercent: "60% OFF",
    extra: null,
    url: "https://pikorafy.com/go/nordpass",
    expiration: "Limited time offer",
    featured: false,
  },
  {
    name: "ConvertKit (Kit)",
    category: "Marketing",
    description:
      "Email marketing platform built for creators. Free plan includes up to 10,000 subscribers with unlimited landing pages and forms.",
    originalPrice: null,
    discountedPrice: "Free",
    discountPercent: "FREE PLAN",
    extra: "Up to 10k subscribers",
    url: "https://pikorafy.com/go/convertkit",
    expiration: "Ongoing offer",
    featured: false,
  },
];

const categories = ["All", ...Array.from(new Set(deals.map((d) => d.category)))];

const featuredDeal = deals.find((d) => d.featured)!;
const regularDeals = deals.filter((d) => !d.featured);

export default function DealsPage() {
  return (
    <div className="bg-[#0f1117] min-h-full py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Exclusive Deals &amp; Discounts
          </h1>
          <p className="mt-4 text-lg text-[#8b8fa3]">
            Hand-picked discounts on the best SaaS, security, and AI tools.
            Save big on software you actually need.
          </p>
        </div>

        {/* Category Filter Chips */}
        <div className="mt-8 flex flex-wrap gap-2">
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

        {/* Deal of the Month - Featured */}
        <div className="mt-12">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#3B82F6] mb-4">
            Deal of the Month
          </h2>
          <a
            href={featuredDeal.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block rounded-2xl border-2 border-[#3B82F6]/40 bg-gradient-to-br from-[#1a1d27] to-[#1e2231] p-8 transition-all hover:border-[#3B82F6]/70 hover:shadow-lg hover:shadow-[#3B82F6]/10"
          >
            {/* Featured badge */}
            <div className="absolute -top-3 right-6 rounded-full bg-[#3B82F6] px-4 py-1 text-xs font-bold text-white shadow-lg">
              FEATURED
            </div>

            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-2xl font-bold text-white">
                    {featuredDeal.name}
                  </h3>
                  <span className="inline-flex rounded-md bg-[#3B82F6]/10 px-2.5 py-0.5 text-xs font-medium text-[#3B82F6]">
                    {featuredDeal.category}
                  </span>
                </div>
                <p className="mt-3 text-[#8b8fa3] max-w-2xl">
                  {featuredDeal.description}
                </p>
                <div className="mt-4 flex items-center gap-4 flex-wrap">
                  <span className="inline-flex rounded-lg bg-green-500/10 px-3 py-1 text-sm font-bold text-green-400">
                    {featuredDeal.discountPercent}
                  </span>
                  {featuredDeal.originalPrice && (
                    <span className="text-[#8b8fa3] line-through text-sm">
                      {featuredDeal.originalPrice}
                    </span>
                  )}
                  <span className="text-2xl font-bold text-white">
                    {featuredDeal.discountedPrice}
                  </span>
                  {featuredDeal.extra && (
                    <span className="text-sm text-green-400 font-medium">
                      {featuredDeal.extra}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-xs text-[#8b8fa3]">
                  {featuredDeal.expiration}
                </p>
              </div>
              <div className="shrink-0">
                <span className="inline-flex items-center gap-2 rounded-lg bg-[#3B82F6] px-6 py-3 text-sm font-semibold text-white transition-colors group-hover:bg-[#2563EB]">
                  Get Deal
                  <svg
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
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
              </div>
            </div>
          </a>
        </div>

        {/* Deals Grid */}
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {regularDeals.map((deal) => (
            <a
              key={deal.name}
              href={deal.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex flex-col rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-6 transition-all hover:border-[#3B82F6]/50 hover:bg-[#1e2231]"
            >
              {/* Discount badge */}
              <div className="absolute -top-2.5 right-4 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-bold text-green-400 border border-green-500/20">
                {deal.discountPercent}
              </div>

              {/* Category */}
              <div className="flex items-center justify-between">
                <span className="inline-flex rounded-md bg-[#3B82F6]/10 px-2 py-0.5 text-xs font-medium text-[#3B82F6]">
                  {deal.category}
                </span>
              </div>

              {/* Tool name */}
              <h3 className="mt-4 text-base font-semibold text-white group-hover:text-[#3B82F6] transition-colors">
                {deal.name}
              </h3>

              {/* Description */}
              <p className="mt-2 flex-1 text-sm text-[#8b8fa3]">
                {deal.description}
              </p>

              {/* Pricing */}
              <div className="mt-4 flex items-baseline gap-2 flex-wrap">
                {deal.originalPrice && (
                  <span className="text-sm text-[#8b8fa3] line-through">
                    {deal.originalPrice}
                  </span>
                )}
                <span className="text-lg font-bold text-white">
                  {deal.discountedPrice}
                </span>
                {deal.extra && (
                  <span className="text-xs text-green-400 font-medium">
                    {deal.extra}
                  </span>
                )}
              </div>

              {/* Expiration */}
              <p className="mt-2 text-xs text-[#8b8fa3]">{deal.expiration}</p>

              {/* CTA */}
              <span className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-[#2563EB]">
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

        {/* Affiliate Disclosure */}
        <div className="mt-16 rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-6">
          <p className="text-sm text-[#8b8fa3]">
            <span className="font-semibold text-[#e4e6eb]">Disclosure:</span>{" "}
            Some links on this page are affiliate links. We may earn a commission
            at no extra cost to you. We only recommend tools we genuinely believe
            in.
          </p>
        </div>
      </div>
    </div>
  );
}
