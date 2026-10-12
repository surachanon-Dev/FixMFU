"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Analytics01Icon, Cancel01Icon, CheckmarkCircle02Icon, Clock01Icon, DashboardSquare01Icon, Layers01Icon, Loading03Icon, Settings02Icon, ToolsIcon } from "@hugeicons/core-free-icons";
import BranchedMenu, { type BranchedMenuItem } from "./branched-menu";

const items: BranchedMenuItem[] = [
  { value: "dashboard", label: "ภาพรวม", href: "/admin/dashboard", icon: DashboardSquare01Icon },
  { label: "จัดการเรื่องแจ้ง", icon: ToolsIcon, children: [
    { value: "all", label: "เรื่องแจ้งทั้งหมด", href: "/admin/tickets", icon: Layers01Icon },
    { value: "pending", label: "รอรับเรื่อง", href: "/admin/tickets?status=pending", icon: Clock01Icon },
    { value: "in_progress", label: "กำลังดำเนินการ", href: "/admin/tickets?status=in_progress", icon: Loading03Icon },
    { value: "completed", label: "เสร็จสิ้น", href: "/admin/tickets?status=completed", icon: CheckmarkCircle02Icon },
    { value: "cancelled", label: "ยกเลิก", href: "/admin/tickets?status=cancelled", icon: Cancel01Icon },
  ] },
  { value: "reports", label: "รายงานสรุป", href: "/admin/reports", icon: Analytics01Icon },
  { value: "settings", label: "ตั้งค่าระบบ", href: "/admin/settings", icon: Settings02Icon },
];

export default function AdminNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const active = pathname.startsWith("/admin/tickets")
    ? pathname === "/admin/tickets" && items[1].children?.some(child => child.value === status) ? status! : "all"
    : pathname.startsWith("/admin/reports") ? "reports"
      : pathname.startsWith("/admin/settings") ? "settings" : "dashboard";

  return <BranchedMenu key={pathname} items={items} activeValue={active} defaultOpen={[1]} onSelect={onNavigate} />;
}
