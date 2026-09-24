import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Service-role client — NEVER expose to the browser.
// Used only in API routes (server-side) to bypass RLS.
// Created lazily so a build without Supabase env vars doesn't crash on import.
let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}
