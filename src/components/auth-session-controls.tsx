import Link from "next/link";
import { logout } from "../app/auth/actions";
import type { AuthProfile } from "../lib/auth";

export function AuthSessionControls({ profile, adminPortal = false }: { profile: AuthProfile; adminPortal?: boolean }) {
  return <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
    <span className="hidden max-w-32 truncate text-muted sm:inline">{profile.full_name || (profile.role === "admin" ? "ผู้ดูแลระบบ" : "ผู้ใช้งาน")}</span>
    {profile.role === "admin" ? <Link href={adminPortal ? "/user" : "/admin/dashboard"} className="rounded-lg border border-line px-3 py-2 hover:bg-background">{adminPortal ? "หน้าผู้ใช้" : "หน้าผู้ดูแล"}</Link> : null}
    <form action={logout}><button className="rounded-lg border border-line px-3 py-2 hover:bg-background focus-visible:outline-2 focus-visible:outline-primary" type="submit">ออกจากระบบ</button></form>
  </div>;
}
