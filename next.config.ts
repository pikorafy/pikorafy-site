import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed sections (tool comparisons, alternatives, articles, AI quiz, gaming hub):
  // send old links and search results somewhere useful instead of a 404.
  async redirects() {
    return [
      { source: "/vs/:path*", destination: "/games", permanent: true },
      { source: "/alternatives/:path*", destination: "/games", permanent: true },
      { source: "/blog/:path*", destination: "/", permanent: true },
      { source: "/quiz", destination: "/games", permanent: true },
      { source: "/gaming", destination: "/games", permanent: true },
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
