import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/admin/session";
import LoginForm from "./LoginForm";
import "../admin.css";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default async function AdminLogin() {
  if (await currentAdmin()) redirect("/admin");
  return (
    <div className="adm adm-login">
      <div className="adm-card">
        <div className="adm-brand" style={{ padding: 0 }}>
          <span className="adm-brand-mark">P</span>
          <span className="adm-brand-name">PIKORAFY</span>
          <span className="adm-tag">admin</span>
        </div>
        <LoginForm />
        <p className="adm-muted" style={{ margin: 0, fontSize: 12 }}>
          No account yet? Create one with <code>scripts/local/create-admin.mts</code> (see docker/README.md).
        </p>
      </div>
    </div>
  );
}
