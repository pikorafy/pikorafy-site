import type { Metadata } from "next";
import StoresClient from "./StoresClient";

export const metadata: Metadata = {
  title: "Game Store Trust Rankings — Pikorafy",
  description:
    "47 stores ranked by trust score, not paid placement. Chargeback rate, refund clarity, licensing, and support response — the four signals that matter.",
  openGraph: {
    title: "Game Store Trust Rankings | Pikorafy",
    description: "Every store audited the same way. Trust score, never paid placement.",
  },
};

export default function StoresPage() {
  return <StoresClient />;
}
