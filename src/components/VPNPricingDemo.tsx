"use client";

import { PricingComparison } from "@/components/ui/pricing-comparison";

const vpnPlans = [
  {
    name: "NordVPN Basic",
    price: "13",
    yearlyPrice: "4",
    period: "month",
    features: [
      "6 simultaneous connections",
      "6,400+ servers in 111 countries",
      "NordLynx (WireGuard) protocol",
      "Threat Protection Lite",
      "No-logs policy (audited)",
      "24/7 live chat support",
    ],
    description: "Best for speed and security-focused users",
    buttonText: "Get NordVPN",
    href: "https://nordvpn.com",
    isPopular: true,
  },
  {
    name: "Surfshark Starter",
    price: "16",
    yearlyPrice: "3",
    period: "month",
    features: [
      "Unlimited simultaneous connections",
      "3,200+ servers in 100 countries",
      "WireGuard protocol",
      "CleanWeb ad blocker",
      "No-logs policy (audited)",
      "24/7 live chat support",
    ],
    description: "Best value with unlimited devices",
    buttonText: "Get Surfshark",
    href: "https://surfshark.com",
    isPopular: false,
  },
  {
    name: "NordVPN Ultra",
    price: "15",
    yearlyPrice: "7",
    period: "month",
    features: [
      "10 simultaneous connections",
      "Everything in Basic",
      "Threat Protection Pro",
      "1TB encrypted cloud storage",
      "Cross-platform password manager",
      "Data breach scanner",
    ],
    description: "Full security suite with extras",
    buttonText: "Get NordVPN Ultra",
    href: "https://nordvpn.com",
    isPopular: false,
  },
];

export default function VPNPricingDemo() {
  return (
    <PricingComparison
      title="NordVPN vs Surfshark — Pricing Breakdown"
      description="Compare monthly and yearly plans to find the best value."
      plans={vpnPlans}
    />
  );
}
