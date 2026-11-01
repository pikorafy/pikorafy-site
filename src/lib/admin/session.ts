import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { redis } from "./redis";

// Admin sessions: a random token in an httpOnly cookie; Redis holds its hash → user id.

const COOKIE = "pk_admin";
const TTL_S = 7 * 24 * 3600;
const key = (token: string) => `admin:session:${createHash("sha256").update(token).digest("hex")}`;

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: "admin" | "editor";
}

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  await redis().set(key(token), String(userId), "EX", TTL_S);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    // Secure cookies need https; the local setup is plain http. Set ADMIN_COOKIE_SECURE=1 online.
    secure: process.env.ADMIN_COOKIE_SECURE === "1",
    path: "/admin",
    maxAge: TTL_S,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) await redis().del(key(token));
  store.delete({ name: COOKIE, path: "/admin" });
}

/** The signed-in admin, or null. Once per request. */
export const currentAdmin = cache(async (): Promise<AdminUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const userId = await redis().get(key(token));
  if (!userId) return null;
  const user = await db()("admin_users").select("id", "email", "name", "role").where({ id: Number(userId) }).first();
  return (user as AdminUser | undefined) ?? null;
});

/** For admin pages and actions: the signed-in admin, or off to the login page. */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await currentAdmin();
  if (!user) redirect("/admin/login");
  return user;
}
