export type AppRole = "user" | "admin";

export function isAppRole(value: unknown): value is AppRole {
  return value === "user" || value === "admin";
}

export function homeForRole(role: AppRole): string {
  return role === "admin" ? "/admin/dashboard" : "/user";
}

export const UNIVERSITY_DOMAIN = "lamduan.mfu.ac.th";

export function isUniversityEmail(email: unknown): email is string {
  return typeof email === "string" && /^[^\s@]+@lamduan\.mfu\.ac\.th$/i.test(email);
}

export function hasOAuthProof(amr: unknown): boolean {
  return Array.isArray(amr) && amr.some((entry) => entry?.method === "oauth");
}

interface GoogleUser {
  email?: string;
  email_confirmed_at?: string;
  identities?: { provider: string; identity_data?: Record<string, unknown> }[];
}

export function hasUniversityGoogleIdentity(user: GoogleUser): boolean {
  if (!user.email_confirmed_at || !isUniversityEmail(user.email)) return false;
  return user.identities?.some((identity) => {
    // Identity data comes from the provider, unlike editable user_metadata.
    const data = identity.identity_data;
    const custom = data?.custom_claims;
    return identity.provider === "google" && data?.email_verified === true
      && typeof data.email === "string" && data.email.toLowerCase() === user.email?.toLowerCase()
      && data.iss === "https://accounts.google.com" && typeof data.sub === "string" && !!data.sub
      && typeof custom === "object" && custom !== null
      && "hd" in custom && custom.hd === UNIVERSITY_DOMAIN;
  }) ?? false;
}
