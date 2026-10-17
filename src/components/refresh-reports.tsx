"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function RefreshReports() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <button type="button" onClick={() => startTransition(() => router.refresh())} disabled={pending} aria-busy={pending} className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm font-medium hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60">{pending ? "กำลังอัปเดต…" : "อัปเดตข้อมูล"}</button>;
}
