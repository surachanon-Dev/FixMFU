"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { UNIVERSITY_DOMAIN } from "../../lib/auth-policy";
import { getAuthOrigin } from "../../lib/supabase/origin";
import { getSupabaseConfig } from "../../lib/supabase/config";

export interface LoginState { error: string }

export async function loginWithGoogle(): Promise<LoginState> {
  let destination: string;
  try {
    const supabase = await createClient();
    const result = await supabase.auth.signInWithOAuth({ provider: "google", options: {
      redirectTo: `${getAuthOrigin()}/auth/callback`,
      scopes: "openid email profile", skipBrowserRedirect: true,
      queryParams: { hd: UNIVERSITY_DOMAIN, prompt: "select_account" },
    } });
    if (result.error || !result.data.url) return { error: "ยังเริ่ม Google Login ไม่ได้ กรุณาตรวจการตั้งค่า Google provider ใน Supabase" };
    const target = new URL(result.data.url);
    if (target.origin !== new URL(getSupabaseConfig().url).origin || target.pathname !== "/auth/v1/authorize") return { error: "ปลายทางเข้าสู่ระบบไม่ถูกต้อง" };
    destination = target.toString();
  } catch {
    return { error: "เชื่อมต่อระบบไม่ได้ กรุณาลองอีกครั้ง" };
  }
  redirect(destination);
}

export async function logout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) redirect("/auth/error");
  redirect("/login");
}
