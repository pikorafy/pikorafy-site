import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The admin's database and queue clients load database drivers dynamically: use them
  // from node_modules as they are instead of bundling them.
  serverExternalPackages: ["knex", "pg", "bullmq", "ioredis"],
  // Forms (admin login, job buttons) also work when the site is reached through a proxy such
  // as Tailscale Serve: PIKORAFY_ALLOWED_ORIGINS is a comma-separated list of those hosts.
  experimental: {
    serverActions: {
      allowedOrigins: (process.env.PIKORAFY_ALLOWED_ORIGINS ?? "").split(",").map((h) => h.trim()).filter(Boolean),
    },
  },
  // Removed sections (tool comparisons, alternatives, articles, AI quiz, gaming hub):
  // send old links and search results somewhere useful instead of a 404.
  async redirects() {
    return [
      { source: "/vs/:path*", destination: "/games", permanent: true },
      { source: "/alternatives/:path*", destination: "/games", permanent: true },
      { source: "/blog/:path*", destination: "/", permanent: true },
      { source: "/quiz", destination: "/games", permanent: true },
      { source: "/gaming", destination: "/games", permanent: true },
      // The old deal pages; deals now come from our own catalog.
      { source: "/deals", destination: "/games?sale=1&sort=discount", permanent: true },
      { source: "/browse", destination: "/games", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.cloudflare.steamstatic.com",
        pathname: "/steam/apps/**",
      },
      {
        protocol: "https",
        hostname: "www.google.com",
        pathname: "/s2/favicons/**",
      },
      {
        protocol: "https",
        hostname: "icon.horse",
        pathname: "/icon/**",
      },
    ],
  },
};

export default nextConfig;
