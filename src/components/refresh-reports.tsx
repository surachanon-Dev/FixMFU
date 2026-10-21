"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function RefreshReports({ label = "อัปเดตข้อมูล" }: { label?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <button type="button" onClick={() => startTransition(() => router.refresh())} disabled={pending} aria-busy={pending} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm font-medium hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"><svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" className={pending ? "motion-safe:animate-spin" : ""}><path d="M20 7v5h-5M4 17v-5h5" strokeLinecap="round" strokeLinejoin="round" /><path d="M6.2 7a7 7 0 0 1 11.5-1L20 9M4 15l2.3 3A7 7 0 0 0 18 17" strokeLinecap="round" /></svg><span role="status">{pending ? "กำลังอัปเดต…" : label}</span></button>;
}
