"use client";

import { usePathname } from "next/navigation";

/** The public site's header and footer stay off the admin pages. */
export default function HideOnAdmin({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return pathname?.startsWith("/admin") ? null : children;
}
