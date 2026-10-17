import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { getAuthOrigin } from "../../../lib/supabase/origin";
import { hasOAuthProof, hasUniversityGoogleIdentity, homeForRole, isAppRole } from "../../../lib/auth-policy";

export async function GET(request: NextRequest) {
  let origin: string;
  try { origin = getAuthOrigin(); }
  catch { return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า URL ของระบบเข้าสู่ระบบ" }, { status: 503, headers: { "Cache-Control": "private, no-store" } }); }
  const destination = (path: string) => {
    const response = NextResponse.redirect(new URL(path, origin), 303);
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  };
  const code = request.nextUrl.searchParams.get("code");
  if (!code || request.nextUrl.searchParams.has("error")) return destination("/login?error=oauth");
  try {
    const supabase = await createClient();
    const exchanged = await supabase.auth.exchangeCodeForSession(code);
    if (exchanged.error) return destination("/login?error=oauth");
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
    if (userError || claimsError || !userData.user || userData.user.id !== claimsData?.claims.sub
        || !hasOAuthProof(claimsData.claims.amr) || !hasUniversityGoogleIdentity(userData.user)) {
      await supabase.auth.signOut({ scope: "local" });
      return destination("/login?error=domain");
    }
    const { data: profile, error } = await supabase.from("profiles").select("role").eq("id", userData.user.id).maybeSingle();
    if (error || !profile || !isAppRole(profile.role)) {
      await supabase.auth.signOut({ scope: "local" });
      return destination("/login?error=profile");
    }
    return destination(homeForRole(profile.role));
  } catch {
    return destination("/login?error=oauth");
  }
}
