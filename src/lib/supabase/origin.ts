import "server-only";

export function getAuthOrigin(): string {
  const value = process.env.NEXT_PUBLIC_SITE_URL;
  if (!value) throw new Error("กรุณาตั้งค่า NEXT_PUBLIC_SITE_URL");
  const url = new URL(value);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if ((url.protocol !== "https:" && !(local && url.protocol === "http:"))
      || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("Site URL ไม่ถูกต้อง");
  }
  return url.origin;
}
