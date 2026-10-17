"use client";

import Link from "next/link";
import { useState } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { CheckmarkCircle02Icon, Clock01Icon, InformationCircleIcon, Search01Icon, Task01Icon, ToolsIcon } from "@hugeicons/core-free-icons";
import { STATUS_LABELS, type Ticket, type TicketStatus } from "../lib/tickets";
import UserReportStart from "./user-report-start";
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
  return <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
    <section aria-labelledby="user-welcome-title" className="rounded-[28px] bg-[#211E18] p-5 text-surface sm:p-8 lg:p-12">
      <div className="grid items-center gap-9 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-10">
        <div className="min-w-0 py-3 lg:py-5">
          <p className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-surface/20 px-4 py-2 text-xs text-surface/90"><span className="h-2 w-2 shrink-0 rounded-full bg-primary" />ระบบแจ้งซ่อมอาคาร มหาวิทยาลัยแม่ฟ้าหลวง</p>
          <h1 id="user-welcome-title" className="text-3xl font-semibold leading-[1.3] tracking-tight sm:text-[48px] xl:text-[56px]">เจอจุดที่พัง<br />บอกเรา <span className="text-primary">แล้วเดี๋ยวจัดการ</span></h1>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-surface/75 sm:text-base">แจ้งปัญหาห้องเรียน หอพัก หรือพื้นที่ส่วนกลางได้ในไม่กี่ขั้นตอน แล้วติดตามความคืบหน้าจากผู้ดูแลได้ตลอด</p>
          <ol aria-label="ขั้นตอนการแจ้งซ่อม" className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3 text-xs font-medium sm:mt-10 sm:text-sm">
            {["แจ้งปัญหา", "ติดตามสถานะ", "รับผลการแก้ไข"].map((step, index) => <li key={step} className="flex items-center gap-2.5"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${index === 0 ? "border-primary bg-primary text-ink" : "border-surface/35 text-surface/90"}`}>{index + 1}</span><span>{step}</span>{index < 2 && <span aria-hidden="true" className="ml-1 hidden h-px w-5 bg-surface/25 xl:block" />}</li>)}
          </ol>
        </div>
        <UserReportStart />
      </div>
    </section>

    <section aria-label="สรุปสถานะเรื่องของฉัน" className="grid gap-3 sm:grid-cols-3 sm:gap-4">{summaries.map(item => <button key={item.status} type="button" aria-pressed={status === item.status} aria-controls="my-ticket-list" aria-label={`${item.label} ${count(item.status)} เรื่อง`} onClick={() => setStatus(status === item.status ? "all" : item.status)} className={`flex items-center justify-between gap-3 rounded-3xl border bg-surface p-5 text-left transition-colors sm:p-6 ${status === item.status ? "border-primary ring-2 ring-primary/10" : "border-line hover:border-primary/50"} ${focusClass}`}>
      <div><p className="text-sm text-muted">{item.label}</p><p className="mt-1 text-3xl font-semibold tabular-nums">{count(item.status)}<span className="ml-2 text-sm font-normal text-ink">เรื่อง</span></p></div><span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${item.color}`}><Icon value={item.icon} size={25} /></span>
    </button>)}</section>

    <section id="my-tickets" className="scroll-mt-44 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-semibold">เรื่องแจ้งซ่อมของฉัน</h2><p className="mt-1 text-sm text-muted">ติดตามความคืบหน้าและอัปเดตจากผู้ดูแล</p></div><p aria-live="polite" className="rounded-full bg-surface px-3 py-1.5 text-xs text-muted">พบ {filtered.length} จาก {own.length} เรื่อง</p></div>
      <div className="flex flex-wrap items-center justify-between gap-3"><div role="group" aria-label="กรองสถานะเรื่องแจ้ง" className="flex flex-wrap gap-1.5">{filters.map(filter => <button key={filter.value} type="button" aria-pressed={status === filter.value} aria-controls="my-ticket-list" onClick={() => setStatus(filter.value)} className={`rounded-full px-3 py-2 text-xs transition-colors ${status === filter.value ? "bg-ink font-medium text-surface" : "bg-surface text-muted hover:text-ink"} ${focusClass}`}>{filter.label}<span className="ml-1.5 opacity-70">{filter.count}</span></button>)}</div><label className="flex w-full items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 focus-within:border-primary sm:w-60"><Icon value={Search01Icon} size={16} className="shrink-0 text-muted" /><span className="sr-only">ค้นหาเรื่องของฉัน</span><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="ค้นหาเรื่องหรืออาคาร" className="min-w-0 w-full text-sm outline-none" /></label></div>
      <p className="flex items-start gap-2 text-xs leading-relaxed text-muted"><Icon value={InformationCircleIcon} size={14} className="mt-0.5 shrink-0" />แสดงเฉพาะเรื่องที่คุณแจ้ง · โหลดหน้าใหม่เพื่อดูสถานะล่าสุด</p>
      <div id="my-ticket-list" className="space-y-4">{filtered.map(ticket => <UserTicketCard key={ticket.id} ticket={ticket} />)}{!filtered.length && <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center"><span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10"><Icon value={Task01Icon} size={25} /></span><p className="font-medium">{!own.length ? "ยังไม่มีเรื่องแจ้งซ่อม" : query ? "ไม่พบเรื่องที่ตรงกับการค้นหา" : "ยังไม่มีเรื่องในสถานะนี้"}</p><p className="mt-2 text-sm text-muted">{!own.length ? "เริ่มแจ้งปัญหาที่พบ แล้วติดตามการแก้ไขได้ที่นี่" : "ลองเลือกสถานะอื่นหรือเปลี่ยนคำค้นหา"}</p>{own.length ? <button type="button" onClick={() => { setStatus("all"); setSearch(""); }} className={`mt-5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium ${focusClass}`}>ดูเรื่องทั้งหมด</button> : <Link href="/user/report" className={`mt-5 inline-block rounded-lg bg-primary px-4 py-2.5 text-sm font-medium ${focusClass}`}>แจ้งปัญหาใหม่</Link>}</div>}</div>
    </section>
  </div>;
}
