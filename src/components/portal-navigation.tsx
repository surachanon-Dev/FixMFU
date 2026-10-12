"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menus = {
  admin: [
    { href: "/admin/dashboard", label: "ภาพรวม" },
    { href: "/admin/tickets", label: "จัดการเรื่องแจ้ง" },
    { href: "/admin/reports", label: "รายงานสรุป" },
    { href: "/admin/settings", label: "ตั้งค่าระบบ" },
  ],
  user: [
    { href: "/user", label: "ประวัติแจ้งซ่อม" },
    { href: "/user/report", label: "แจ้งปัญหาใหม่" },
  ],
};

export default function PortalNavigation({ portal }: { portal: "admin" | "user" }) {
  const pathname = usePathname();
  return <nav aria-label={portal === "admin" ? "เมนูผู้ดูแลระบบ" : "เมนูผู้ใช้งาน"} className="flex w-full flex-wrap gap-2 border-t border-line pt-3 sm:w-auto sm:border-0 sm:pt-0">
    {menus[portal].map(link => {
      const active = link.href === "/user"
        ? pathname === "/user" || pathname.startsWith("/user/ticket/")
        : pathname === link.href || pathname.startsWith(`${link.href}/`);
      return <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined} className={`rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${active ? "bg-primary text-ink" : "text-muted hover:bg-background hover:text-ink"}`}>{link.label}</Link>;
    })}
  </nav>;
}
