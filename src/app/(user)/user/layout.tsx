import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FixMFU - แจ้งซ่อมและติดตามสถานะ",
};

export default function UserLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <header className="sticky top-0 z-50 bg-blue-900 text-white shadow-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/user" className="flex items-center gap-2 text-xl font-bold tracking-wide">
            <span aria-hidden="true">🛠️</span> FixMFU
          </Link>
          <span className="rounded-full bg-blue-800 px-3 py-1 text-sm text-blue-100">สำหรับผู้ใช้งาน</span>
          <nav aria-label="เมนูผู้ใช้งาน" className="flex w-full flex-wrap gap-2 border-t border-blue-800 pt-3 sm:w-auto sm:border-0 sm:pt-0">
            <Link href="/user" className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">ประวัติแจ้งซ่อม</Link>
            <Link href="/user/report" className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">แจ้งปัญหาใหม่</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 pb-8">{children}</main>
    </>
  );
}
