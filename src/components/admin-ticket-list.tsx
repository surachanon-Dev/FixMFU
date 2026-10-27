"use client";

import { useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { StatusBadge, TicketTable, buttonClass, inputClass } from "./tickets";
import { RefreshReports } from "./refresh-reports";
import { STATUS_LABELS, formatDate, formatMonth, type Ticket, type TicketStatus } from "../lib/tickets";
import { ADMIN_SORTS, adminTicketHref, adminTicketView } from "../lib/admin-ticket-view";

const focusClass = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary";

export default function AdminTicketList({ tickets }: { tickets: Ticket[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const params = new URLSearchParams(searchParams.toString());
  const view = adminTicketView(tickets, searchParams);
  const { filters } = view;
  const period = filters.month ? formatMonth(filters.month) : filters.year ? `ปี ${Number(filters.year) + 543}` : "";
  const activeFilters = [
    { key: "q", label: filters.query ? `ค้นหา: ${filters.query}` : "" },
    { key: "status", label: filters.status ? STATUS_LABELS[filters.status as TicketStatus] : "" },
    { key: "building", label: filters.building },
    { key: "category", label: filters.category },
  ].filter(item => item.label);
  const hasFilters = Boolean(activeFilters.length || period);
  const navigate = (href: string) => startTransition(() => router.push(href, { scroll: false }));
  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    navigate(adminTicketHref(params, Object.fromEntries(["q", "status", "building", "category"].map(key => [key, String(form.get(key) ?? "").trim()]))));
  };
  const options = (key: "building" | "category") => [...new Set([...tickets.map(ticket => ticket[key]), filters[key]].filter(Boolean))].sort((a, b) => a.localeCompare(b, "th"));
  const pageNumbers = [...new Set([1, view.page - 1, view.page, view.page + 1, view.pageCount])].filter(page => page >= 1 && page <= view.pageCount).sort((a, b) => a - b);

  return <div className="p-4 sm:p-6 lg:p-8">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-semibold">จัดการเรื่องแจ้ง</h1><RefreshReports /></div>
    <p className="mb-6 mt-2 text-muted">ค้นหา กรอง และจัดลำดับคิวงาน · เปิดเรื่องแจ้งเพื่อรับเรื่องหรืออัปเดตสถานะ</p>
    <form key={searchParams.toString()} action="/admin/tickets" method="get" role="search" aria-label="ค้นหาและกรองเรื่องแจ้ง" onSubmit={applyFilters} className="mb-5 grid gap-4 rounded-2xl border border-line bg-surface p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
      {filters.year && <input type="hidden" name="year" value={filters.year} />}{filters.month && <input type="hidden" name="month" value={filters.month} />}{filters.sort !== "newest" && <input type="hidden" name="sort" value={filters.sort} />}
      <label className="text-sm font-medium">ค้นหาเรื่องแจ้ง<input name="q" type="search" defaultValue={filters.query} maxLength={200} placeholder="รหัส เรื่อง สถานที่ หรือผู้แจ้ง" className={`${inputClass} mt-2`} /></label>
      <label className="text-sm font-medium">สถานะ<select name="status" defaultValue={filters.status} className={`${inputClass} mt-2`}><option value="">ทุกสถานะ</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="text-sm font-medium">อาคาร<select name="building" defaultValue={filters.building} className={`${inputClass} mt-2`}><option value="">ทุกอาคาร</option>{options("building").map(value => <option key={value}>{value}</option>)}</select></label>
      <label className="text-sm font-medium">ประเภทปัญหา<select name="category" defaultValue={filters.category} className={`${inputClass} mt-2`}><option value="">ทุกประเภท</option>{options("category").map(value => <option key={value}>{value}</option>)}</select></label>
      <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2 lg:col-span-4"><p className="text-xs text-muted">เลือกเงื่อนไขแล้วกดค้นหา · เก็บตัวกรองไว้ในลิงก์นี้</p><button type="submit" disabled={pending} className={`${buttonClass} min-h-11 ${focusClass}`}>{pending ? "กำลังค้นหา…" : "ค้นหา / ใช้ตัวกรอง"}</button></div>
    </form>
    {hasFilters && <div className="mb-5 flex flex-wrap items-center gap-2" aria-label="ตัวกรองที่ใช้อยู่">
      {period && <Link scroll={false} href={adminTicketHref(params, { year: "", month: "" })} className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 text-xs ${focusClass}`} aria-label={`ล้างช่วง ${period}`}>{period}<span aria-hidden="true">×</span></Link>}
      {activeFilters.map(item => <Link key={item.key} scroll={false} href={adminTicketHref(params, { [item.key]: "" })} className={`inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border border-line bg-surface px-3 text-xs ${focusClass}`} aria-label={`ล้างตัวกรอง ${item.label}`}><span className="truncate">{item.label}</span><span aria-hidden="true">×</span></Link>)}
      <Link href="/admin/tickets" scroll={false} className={`inline-flex min-h-11 items-center px-2 text-sm font-medium underline underline-offset-4 ${focusClass}`}>ล้างทั้งหมด</Link>
    </div>}
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p role="status" aria-live="polite" className="text-sm text-muted">{view.total ? `แสดง ${view.start}–${view.end} จาก ${view.total} เรื่อง` : "ไม่พบเรื่องแจ้ง"}{hasFilters && ` · ทั้งระบบ ${tickets.length} เรื่อง`}</p><label className="flex items-center gap-2 whitespace-nowrap text-sm">เรียงตาม<select value={filters.sort} onChange={event => navigate(adminTicketHref(params, { sort: event.target.value === "newest" ? "" : event.target.value }))} className={`${inputClass} w-auto`}>{Object.entries(ADMIN_SORTS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
    <div aria-busy={pending} className={pending ? "opacity-60" : ""}>
      {!view.total ? <section className="rounded-2xl border border-dashed border-line bg-surface px-5 py-12 text-center"><h2 className="text-lg font-semibold">{tickets.length ? "ไม่พบเรื่องที่ตรงกับตัวกรอง" : "ยังไม่มีเรื่องแจ้งในระบบ"}</h2><p className="mx-auto mt-2 max-w-md text-sm text-muted">{tickets.length ? "ลองใช้คำค้นสั้นลง เปลี่ยนสถานะ หรือเอาตัวกรองบางรายการออก" : "เมื่อผู้ใช้ส่งเรื่องใหม่ รายการจะปรากฏที่นี่ กดอัปเดตข้อมูลเพื่อตรวจสอบอีกครั้ง"}</p>{hasFilters && <Link href="/admin/tickets" className={`mt-5 inline-flex min-h-11 items-center ${buttonClass} ${focusClass}`}>ดูเรื่องแจ้งทั้งหมด</Link>}</section> : <>
        <div className="space-y-3 lg:hidden">{view.items.map(ticket => <Link key={ticket.id} href={`/admin/tickets/${ticket.id}`} className={`block rounded-2xl border border-line bg-surface p-4 hover:border-primary ${focusClass}`} aria-label={`ดูรายละเอียด ${ticket.number ?? ticket.id} ${ticket.title}`}><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-muted">{ticket.number ?? ticket.id}</span><StatusBadge status={ticket.status} /></div><h2 className="break-words font-semibold">{ticket.title}</h2><p className="mt-2 break-words text-sm text-muted">{ticket.building} · {ticket.location}</p><div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-xs text-muted"><span>{ticket.category}</span><time dateTime={ticket.createdAt}>{formatDate(ticket.createdAt)}</time></div><span className="mt-3 block text-sm font-medium">ดูรายละเอียด →</span></Link>)}</div>
        <div className="hidden lg:block"><TicketTable tickets={view.items} /></div>
      </>}
    </div>
    {view.pageCount > 1 && <nav aria-label="หน้ารายการเรื่องแจ้ง" className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3">
      {view.page > 1 ? <Link scroll={false} href={adminTicketHref(params, { page: String(view.page - 1) }, false)} className={`inline-flex min-h-11 items-center rounded-lg px-3 text-sm hover:bg-background ${focusClass}`} rel="prev">← ก่อนหน้า</Link> : <span aria-disabled="true" className="px-3 text-sm text-muted">← ก่อนหน้า</span>}
      <div className="flex flex-wrap items-center gap-1">{pageNumbers.map((page, index) => <span key={page} className="inline-flex items-center">{index > 0 && page - pageNumbers[index - 1] > 1 && <span className="px-1 text-muted" aria-hidden="true">…</span>}<Link scroll={false} href={adminTicketHref(params, { page: page === 1 ? "" : String(page) }, false)} aria-label={`หน้า ${page}`} aria-current={page === view.page ? "page" : undefined} className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg px-2 text-sm ${page === view.page ? "bg-primary font-semibold" : "hover:bg-background"} ${focusClass}`}>{page}</Link></span>)}</div>
      {view.page < view.pageCount ? <Link scroll={false} href={adminTicketHref(params, { page: String(view.page + 1) }, false)} className={`inline-flex min-h-11 items-center rounded-lg px-3 text-sm hover:bg-background ${focusClass}`} rel="next">ถัดไป →</Link> : <span aria-disabled="true" className="px-3 text-sm text-muted">ถัดไป →</span>}
    </nav>}
  </div>;
}
