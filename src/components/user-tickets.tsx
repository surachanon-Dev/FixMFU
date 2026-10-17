"use client";

import Link from "next/link";
import { useState } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { Add01Icon, ArrowRight01Icon, CheckmarkCircle02Icon, Clock01Icon, InformationCircleIcon, Search01Icon, Task01Icon, ToolsIcon } from "@hugeicons/core-free-icons";
import { STATUS_LABELS, type Ticket, type TicketStatus } from "../lib/tickets";
import UserHeroIllustration from "./user-hero-illustration";
import UserTicketCard from "./user-ticket-card";

const focusClass = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary";
const summaries: { status: TicketStatus; label: string; icon: IconSvgElement; color: string }[] = [
  { status: "pending", label: STATUS_LABELS.pending, icon: Clock01Icon, color: "bg-primary/15 text-amber-700" },
  { status: "in_progress", label: STATUS_LABELS.in_progress, icon: ToolsIcon, color: "bg-blue-50 text-blue-700" },
  { status: "completed", label: STATUS_LABELS.completed, icon: CheckmarkCircle02Icon, color: "bg-emerald-50 text-emerald-700" },
];

function Icon({ value, size = 18, className = "" }: { value: IconSvgElement; size?: number; className?: string }) {
  return <HugeiconsIcon icon={value} size={size} strokeWidth={1.6} className={className} aria-hidden="true" />;
}

export function UserTickets({ tickets }: { tickets: Ticket[] }) {
  const [status, setStatus] = useState<TicketStatus | "all">("all");
  const [search, setSearch] = useState("");
  const own = [...tickets].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const count = (value: TicketStatus) => own.filter(ticket => ticket.status === value).length;
  const query = search.trim().toLocaleLowerCase("th");
  const filtered = own.filter(ticket => (status === "all" || ticket.status === status) && [ticket.number ?? ticket.id, ticket.title, ticket.building, ticket.location, ticket.category].join(" ").toLocaleLowerCase("th").includes(query));
  const filters: { value: TicketStatus | "all"; label: string; count: number }[] = [{ value: "all", label: "ทั้งหมด", count: own.length }, ...summaries.map(item => ({ value: item.status, label: item.label, count: count(item.status) })), ...(count("cancelled") ? [{ value: "cancelled" as const, label: STATUS_LABELS.cancelled, count: count("cancelled") }] : [])];
  return <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
    <section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-linear-to-br from-primary/20 via-primary/10 to-surface p-6 sm:p-8 lg:p-10">
      <span aria-hidden="true" className="pointer-events-none absolute -top-16 -right-10 h-64 w-64 rounded-full border-[36px] border-surface/30" />
      <div className="relative grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_300px] lg:grid-cols-[minmax(0,1fr)_340px]">
        <div><p className="mb-4 inline-flex items-center gap-2 rounded-full bg-surface/75 px-3 py-1.5 text-xs font-medium text-ink"><span className="h-1.5 w-1.5 rounded-full bg-primary" />พื้นที่ดูแลอาคารของเรา</p><h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-[42px]">แจ้งปัญหา<br /><span className="text-amber-800">เราช่วยดูแล</span></h1><p className="mt-4 max-w-md text-sm leading-relaxed text-muted">พบปัญหาในห้องเรียน หอพัก หรือพื้นที่ส่วนกลาง<br className="hidden sm:block" />แจ้งให้เราทราบ แล้วติดตามการแก้ไขได้ที่นี่</p>
          <div className="mt-6 flex flex-wrap items-center gap-3"><Link href="/user/report" className={`inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-ink shadow-xs transition-colors hover:bg-primary-hover ${focusClass}`}><Icon value={Add01Icon} />แจ้งปัญหาใหม่</Link><a href="#my-tickets" className={`inline-flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium text-ink hover:bg-surface/50 ${focusClass}`}>ดูเรื่องของฉัน<Icon value={ArrowRight01Icon} size={16} /></a></div>
          <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-muted"><span className="inline-flex items-center gap-1.5"><Icon value={Task01Icon} size={14} />แจ้งปัญหา</span><span className="inline-flex items-center gap-1.5"><Icon value={Clock01Icon} size={14} />ติดตามสถานะ</span><span className="inline-flex items-center gap-1.5"><Icon value={CheckmarkCircle02Icon} size={14} />รับผลการแก้ไข</span></div>
        </div>
        <div className="hidden md:block"><UserHeroIllustration /></div>
      </div>
    </section>

    <section aria-label="สรุปสถานะเรื่องของฉัน" className="grid grid-cols-3 gap-2 sm:gap-4">{summaries.map(item => <button key={item.status} type="button" aria-pressed={status === item.status} aria-controls="my-ticket-list" aria-label={`${item.label} ${count(item.status)} เรื่อง`} onClick={() => setStatus(status === item.status ? "all" : item.status)} className={`rounded-2xl border bg-surface p-3 text-left shadow-xs transition-colors sm:p-5 ${status === item.status ? "border-primary ring-2 ring-primary/10" : "border-line hover:border-primary/50"} ${focusClass}`}>
      <div className="flex items-center justify-between gap-2"><span className={`flex h-8 w-8 items-center justify-center rounded-lg sm:h-10 sm:w-10 ${item.color}`}><Icon value={item.icon} size={18} /></span><Icon value={ArrowRight01Icon} size={14} className="text-muted" /></div><p className="mt-3 min-h-8 text-[11px] text-muted sm:min-h-0 sm:text-sm">{item.label}</p><p className="text-2xl font-semibold tabular-nums sm:mt-1 sm:text-3xl">{count(item.status)}<span className="ml-1.5 text-[11px] font-normal text-muted sm:text-xs">เรื่อง</span></p>
    </button>)}</section>

    <section id="my-tickets" className="scroll-mt-44 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-semibold">เรื่องแจ้งซ่อมของฉัน</h2><p className="mt-1 text-sm text-muted">ติดตามความคืบหน้าและอัปเดตจากผู้ดูแล</p></div><p aria-live="polite" className="rounded-full bg-surface px-3 py-1.5 text-xs text-muted">พบ {filtered.length} จาก {own.length} เรื่อง</p></div>
      <div className="flex flex-wrap items-center justify-between gap-3"><div role="group" aria-label="กรองสถานะเรื่องแจ้ง" className="flex flex-wrap gap-1.5">{filters.map(filter => <button key={filter.value} type="button" aria-pressed={status === filter.value} aria-controls="my-ticket-list" onClick={() => setStatus(filter.value)} className={`rounded-full px-3 py-2 text-xs transition-colors ${status === filter.value ? "bg-ink font-medium text-surface" : "bg-surface text-muted hover:text-ink"} ${focusClass}`}>{filter.label}<span className="ml-1.5 opacity-70">{filter.count}</span></button>)}</div><label className="flex w-full items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 focus-within:border-primary sm:w-60"><Icon value={Search01Icon} size={16} className="shrink-0 text-muted" /><span className="sr-only">ค้นหาเรื่องของฉัน</span><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="ค้นหาเรื่องหรืออาคาร" className="min-w-0 w-full text-xs outline-none" /></label></div>
      <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted"><Icon value={InformationCircleIcon} size={14} className="mt-0.5 shrink-0" />แสดงเฉพาะเรื่องที่คุณแจ้ง · โหลดหน้าใหม่เพื่อดูสถานะล่าสุด</p>
      <div id="my-ticket-list" className="space-y-4">{filtered.map(ticket => <UserTicketCard key={ticket.id} ticket={ticket} />)}{!filtered.length && <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center"><span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10"><Icon value={Task01Icon} size={25} /></span><p className="font-medium">{!own.length ? "ยังไม่มีเรื่องแจ้งซ่อม" : query ? "ไม่พบเรื่องที่ตรงกับการค้นหา" : "ยังไม่มีเรื่องในสถานะนี้"}</p><p className="mt-2 text-sm text-muted">{!own.length ? "เริ่มแจ้งปัญหาที่พบ แล้วติดตามการแก้ไขได้ที่นี่" : "ลองเลือกสถานะอื่นหรือเปลี่ยนคำค้นหา"}</p>{own.length ? <button type="button" onClick={() => { setStatus("all"); setSearch(""); }} className={`mt-5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium ${focusClass}`}>ดูเรื่องทั้งหมด</button> : <Link href="/user/report" className={`mt-5 inline-block rounded-lg bg-primary px-4 py-2.5 text-sm font-medium ${focusClass}`}>แจ้งปัญหาใหม่</Link>}</div>}</div>
    </section>
  </div>;
}
