"use client";

import { Suspense, useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Menu01Icon } from "@hugeicons/core-free-icons";
import AdminNavigation from "./admin-navigation";

function NavigationFallback() {
  return <p role="status" className="px-3 text-sm text-muted">กำลังโหลดเมนู…</p>;
}

export default function AdminShell({ children, sessionControls }: { children: ReactNode; sessionControls?: ReactNode }) {
  const drawerRef = useRef<HTMLDialogElement>(null);
  const closeMenu = () => drawerRef.current?.close();
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => { if (desktop.matches) drawerRef.current?.close(); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  return <>
    <header className="sticky top-0 z-40 border-b border-line bg-surface text-ink">
      <div className="mx-auto flex min-h-18 max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/admin/dashboard" className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          FixMFU
        </Link>
        <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-2 sm:gap-3">
          {sessionControls}
          <span className="hidden rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-ink sm:inline sm:text-sm">สำหรับผู้ดูแลระบบ</span>
          <button type="button" aria-label="เปิดเมนูผู้ดูแลระบบ" aria-haspopup="dialog" aria-controls="admin-mobile-menu" onClick={() => drawerRef.current?.showModal()} className="rounded-lg border border-line p-2 text-ink focus-visible:outline-2 focus-visible:outline-primary lg:hidden">
            <HugeiconsIcon icon={Menu01Icon} size={20} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
    <div className="mx-auto flex w-full max-w-[1600px] flex-1">
      <aside className="sticky top-[73px] hidden h-[calc(100dvh-73px)] w-72 shrink-0 flex-col border-r border-line bg-surface p-6 lg:flex">
        <p className="mb-6 px-3 text-xs font-medium text-muted">พื้นที่จัดการระบบ</p>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Suspense fallback={<NavigationFallback />}><AdminNavigation /></Suspense>
        </div>
        <p className="mt-6 border-t border-line px-3 pt-5 text-xs text-muted">ระบบแจ้งซ่อม · มหาวิทยาลัยแม่ฟ้าหลวง</p>
      </aside>
      <main className="min-w-0 flex-1 pb-8">{children}</main>
    </div>
    <dialog ref={drawerRef} id="admin-mobile-menu" aria-labelledby="admin-menu-title" onClick={event => { if (event.target === event.currentTarget) closeMenu(); }} className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-[min(20rem,calc(100vw-2rem))] max-w-none border-r border-line bg-surface p-6 text-ink shadow-xl backdrop:bg-ink/30">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 id="admin-menu-title" className="font-semibold">เมนูผู้ดูแลระบบ</h2>
        <button type="button" aria-label="ปิดเมนูผู้ดูแลระบบ" onClick={closeMenu} className="rounded-lg p-2 hover:bg-background focus-visible:outline-2 focus-visible:outline-primary"><HugeiconsIcon icon={Cancel01Icon} size={20} aria-hidden="true" /></button>
      </div>
      <Suspense fallback={<NavigationFallback />}><AdminNavigation onNavigate={closeMenu} /></Suspense>
    </dialog>
  </>;
}
