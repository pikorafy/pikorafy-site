"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/admin/db";
import { verifyPassword } from "@/lib/admin/password";
import { redis } from "@/lib/admin/redis";
import { createSession, destroySession } from "@/lib/admin/session";

const MAX_FAILS = 8;           // per email and per address, within the window
const WINDOW_S = 15 * 60;

export interface LoginState { error?: string; email?: string }

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password.", email };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const keys = [`admin:login-fail:email:${email}`, `admin:login-fail:ip:${ip}`];
  const counts = await redis().mget(...keys);
  if (counts.some((c) => Number(c) >= MAX_FAILS)) {
    return { error: "Too many attempts. Try again in 15 minutes.", email };
  }

  const user = await db()("admin_users").select("id", "password_hash").where({ email }).first();
  const ok = user ? await verifyPassword(password, user.password_hash) : false;
  if (!ok) {
    const tx = redis().multi();
    for (const k of keys) tx.incr(k).expire(k, WINDOW_S);
    await tx.exec();
    return { error: "Wrong email or password.", email };
  }

  await redis().del(...keys);
  await db()("admin_users").where({ id: user.id }).update({ last_login_at: db().fn.now() });
  await createSession(user.id);
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}
