import Link from "next/link";
import { logout } from "../app/auth/actions";
import type { AuthProfile } from "../lib/auth";

export function AuthSessionControls({ profile, adminPortal = false, userPortal = false }: { profile: AuthProfile; adminPortal?: boolean; userPortal?: boolean }) {
  const controlClass = userPortal ? "inline-flex min-h-12 items-center rounded-xl border border-line px-4 py-2 font-medium hover:bg-background" : "rounded-lg border border-line px-3 py-2 hover:bg-background";
  return <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
    <span className="hidden max-w-32 truncate text-muted sm:inline">{profile.full_name || (profile.role === "admin" ? "ผู้ดูแลระบบ" : "ผู้ใช้งาน")}</span>
    {profile.role === "admin" ? <Link href={adminPortal ? "/user" : "/admin/dashboard"} className={controlClass}>{adminPortal ? "หน้าผู้ใช้" : "หน้าผู้ดูแล"}</Link> : null}
    <form action={logout}><button className={`${controlClass} focus-visible:outline-2 focus-visible:outline-primary`} type="submit">ออกจากระบบ</button></form>
  </div>;
}
