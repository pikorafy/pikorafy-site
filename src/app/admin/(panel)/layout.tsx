import type { Metadata } from "next";
import Link from "next/link";
import { openReviewCount } from "@/lib/admin/review";
import { requireAdmin } from "@/lib/admin/session";
import { logout } from "../actions";
import AdminNav from "./AdminNav";
import "../admin.css";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const reviewCount = await openReviewCount();
  return (
    <div className="adm">
      <aside className="adm-side">
        <Link href="/admin" className="adm-brand">
          <span className="adm-brand-mark">P</span>
          <span className="adm-brand-name">PIKORAFY</span>
          <span className="adm-tag">admin</span>
        </Link>
        <AdminNav reviewCount={reviewCount} />
        <div className="adm-user">
          <span className="adm-avatar" aria-hidden="true">{user.name.slice(0, 1).toUpperCase()}</span>
          <span className="adm-user-text"><strong>{user.name}</strong><span>{user.role === "admin" ? "Admin" : "Editor"}</span></span>
          <form action={logout}><button type="submit" className="adm-btn" aria-label="Sign out" title="Sign out">↪</button></form>
        </div>
      </aside>
      <main className="adm-main">{children}</main>
    </div>
  );
}
