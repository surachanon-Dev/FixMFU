import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FixMFU - ระบบผู้ดูแล",
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <header className="sticky top-0 z-50 bg-slate-900 text-white shadow-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/admin/dashboard" className="flex items-center gap-2 text-xl font-bold tracking-wide">
            <span aria-hidden="true">🛠️</span> FixMFU
          </Link>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-900">สำหรับผู้ดูแลระบบ</span>
          <nav aria-label="เมนูผู้ดูแลระบบ" className="flex w-full flex-wrap gap-2 border-t border-slate-700 pt-3 sm:w-auto sm:border-0 sm:pt-0">
            <Link href="/admin/dashboard" className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">สถิติ</Link>
            <Link href="/admin/kanban" className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">กระดานช่าง</Link>
            <Link href="/admin/settings" className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">ตั้งค่า</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 pb-8">{children}</main>
    </>
  );
}
