import type { Metadata } from "next";
import Link from "next/link";
import PortalNavigation from "../../../components/portal-navigation";
import UserNotificationToggle from "../../../components/user-notification-toggle";

export const metadata: Metadata = {
  title: "FixMFU - แจ้งซ่อมและติดตามสถานะ",
};

export default function UserLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line bg-surface text-ink shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div className="order-1"><Link href="/user" className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <span aria-hidden="true">🛠️</span> FixMFU
          </Link><p className="mt-1 text-[10px] text-muted">พื้นที่สำหรับผู้ใช้งาน</p></div>
          <div className="order-3 w-full md:order-2 md:w-auto"><PortalNavigation portal="user" /></div>
          <div className="order-2 md:order-3"><UserNotificationToggle compact /></div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 pb-8">{children}</main>
    </>
  );
}
