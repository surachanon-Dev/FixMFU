import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { hasOAuthProof, hasUniversityGoogleIdentity, isAppRole, type AppRole } from "./auth-policy";

export interface AuthProfile { id: string; full_name: string; role: AppRole }
interface AuthState { profile: AuthProfile | null; error: boolean }

export const getAuthState = cache(async (): Promise<AuthState> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims.sub) return { profile: null, error: false };
    if (!hasOAuthProof(data.claims.amr)) return { profile: null, error: false };
    const verified = await supabase.auth.getUser();
    if (verified.error) return { profile: null, error: true };
    if (!verified.data.user || verified.data.user.id !== data.claims.sub || !hasUniversityGoogleIdentity(verified.data.user)) return { profile: null, error: false };
    const result = await supabase.from("profiles").select("id, full_name, role").eq("id", data.claims.sub).maybeSingle();
    if (result.error || !result.data || !isAppRole(result.data.role)) return { profile: null, error: true };
    return { profile: { id: result.data.id, full_name: result.data.full_name, role: result.data.role }, error: false };
  } catch {
    return { profile: null, error: true };
  }
});

export async function requireProfile(adminOnly = false): Promise<AuthProfile> {
  const state = await getAuthState();
  if (state.error) redirect("/auth/error");
  if (!state.profile) redirect("/login");
  if (adminOnly && state.profile.role !== "admin") redirect("/forbidden");
  return state.profile;
}
