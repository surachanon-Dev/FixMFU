/** Keep browser, Proxy and Server Action session cookies on the same policy. */
export function getSupabaseCookieOptions() {
  // Use the configured public origin, never an untrusted forwarded request header.
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  let secure = false;
  try { secure = !!site && new URL(site).protocol === "https:"; }
  catch { /* The auth origin validator reports invalid configuration during login. */ }
  return { path: "/", sameSite: "lax" as const, secure };
}
