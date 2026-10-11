import type { Metadata } from "next";
import Link from "next/link";
import PortalNavigation from "../../../components/portal-navigation";

export const metadata: Metadata = {
  title: "FixMFU - แจ้งซ่อมและติดตามสถานะ",
};

export default function UserLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line bg-surface text-ink shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/user" className="flex items-center gap-2 text-xl font-bold tracking-wide">
            <span aria-hidden="true">🛠️</span> FixMFU
          </Link>
          <span className="rounded-full bg-background px-3 py-1 text-sm text-muted">สำหรับผู้ใช้งาน</span>
          <PortalNavigation portal="user" />
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 pb-8">{children}</main>
    </>
  );
}
