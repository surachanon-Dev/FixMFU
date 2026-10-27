"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";
import { getSupabaseCookieOptions } from "./cookie-options";

export function createClient() {
  const { url, key } = getSupabaseConfig();
  return createBrowserClient(url, key, { cookieOptions: getSupabaseCookieOptions() });
}
