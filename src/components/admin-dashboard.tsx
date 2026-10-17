"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { Analytics01Icon, ArrowRight01Icon, ArrowUpRight01Icon, Building03Icon, Calendar03Icon, CheckmarkCircle02Icon, Clock01Icon, InformationCircleIcon, Task01Icon, ToolsIcon } from "@hugeicons/core-free-icons";
import { TicketTable } from "./tickets";
import { RefreshReports } from "./refresh-reports";
import { MonthlyTicketChart, SegmentMeter, StatusDonut, STATUS_DOTS } from "./dashboard-charts";
import { STATUS_LABELS, formatDate, formatMonth, ticketMonth, type Ticket, type TicketStatus } from "../lib/tickets";
import { MONTH_LABELS, dashboardTicketHref, summarizeDashboard } from "../lib/dashboard";

const panelClass = "rounded-2xl border border-line bg-surface p-5 shadow-xs sm:p-6";
const focusClass = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary";
const statuses = Object.keys(STATUS_LABELS) as TicketStatus[];

function Icon({ value, size = 18, className = "" }: { value: IconSvgElement; size?: number; className?: string }) {
  return <HugeiconsIcon icon={value} size={size} strokeWidth={1.6} className={className} aria-hidden="true" />;
}

function PanelHeading({ title, action }: { title: string; action?: ReactNode }) {
  return <div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-base font-medium text-ink">{title}</h2>{action}</div>;
}

export default function AdminDashboard({ tickets }: { tickets: Ticket[] }) {
  const [selection, setSelection] = useState<{ year: number | null; month: number | null }>({ year: null, month: null });
  const currentYear = Number(new Intl.DateTimeFormat("en", { timeZone: "Asia/Bangkok", year: "numeric" }).format(new Date()));
  const years = [...new Set([currentYear, ...tickets.map(ticket => Number(ticketMonth(ticket).slice(0, 4)))])].sort((a, b) => b - a);
  const year = selection.year ?? years[0];
  const month = selection.month;
  const data = summarizeDashboard(tickets, year, month);
  const period = month === null ? `ปี ${year + 543}` : formatMonth(`${year}-${String(month + 1).padStart(2, "0")}`);
  const href = (status?: TicketStatus, building?: string) => dashboardTicketHref(year, month, status, building);
  const share = (value: number) => data.total ? Math.round(value / data.total * 100) : 0;
  const stats: { title: string; value: number; icon: IconSvgElement; status?: TicketStatus; badge: string; description: string }[] = [
    { title: "เรื่องแจ้งทั้งหมด", value: data.total, icon: Task01Icon, badge: `${data.buildings.length} อาคาร`, description: `รวมเรื่องยกเลิก ${data.counts.cancelled} เรื่อง` },
    { title: "รอรับเรื่อง", value: data.counts.pending, icon: Clock01Icon, status: "pending", badge: `${share(data.counts.pending)}% ของทั้งหมด`, description: "รอประสานงานและเริ่มตรวจสอบ" },
    { title: "กำลังดำเนินการ", value: data.counts.in_progress, icon: ToolsIcon, status: "in_progress", badge: `${share(data.counts.in_progress)}% ของทั้งหมด`, description: "รับเรื่องแล้ว อยู่ระหว่างแก้ไข" },
    { title: "เสร็จสิ้น", value: data.counts.completed, icon: CheckmarkCircle02Icon, status: "completed", badge: `${data.completionRate}% ของทั้งหมด`, description: "แก้ไขและปิดงานเรียบร้อย" },
  ];
  const reportsLink = <Link href="/admin/reports" className={`inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-ink ${focusClass}`}>ดูรายงาน<Icon value={ArrowUpRight01Icon} size={14} /></Link>;

  return <div className="space-y-5 p-4 sm:p-6 xl:p-7">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><div className="mb-2 flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" /><p className="text-xs font-medium text-muted">ศูนย์จัดการงานซ่อม</p></div><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">ภาพรวมระบบ</h1><p className="mt-2 text-sm text-muted">ติดตามเรื่องแจ้งและการดำเนินงานในมุมเดียว</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <RefreshReports />
        <label className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2.5 text-sm"><Icon value={Calendar03Icon} size={16} /><span className="sr-only">ปีที่แสดง</span><select value={year} onChange={event => setSelection({ year: Number(event.target.value), month: null })} className="cursor-pointer bg-transparent pr-1 text-sm outline-none focus-visible:outline-2 focus-visible:outline-primary">{years.map(value => <option key={value} value={value}>ปี {value + 543}</option>)}</select></label>
        <Link href={href()} className={`inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-ink hover:bg-primary-hover ${focusClass}`}>จัดการเรื่องแจ้ง<Icon value={ArrowRight01Icon} size={16} /></Link>
      </div>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted"><p className="inline-flex items-center gap-2"><Icon value={InformationCircleIcon} size={14} />สถานะปัจจุบันของเรื่องที่แจ้งในช่วงที่เลือก</p><span className="rounded-full border border-line bg-surface px-3 py-1">{period}</span></div>

    <section aria-label="สถิติเรื่องแจ้ง" className="grid grid-cols-2 gap-3 min-[75rem]:grid-cols-4">
      {stats.map(card => <Link key={card.title} href={href(card.status)} className={`group rounded-2xl border border-line bg-surface p-4 shadow-xs transition-colors hover:border-primary sm:p-5 ${focusClass}`}>
        <div className="mb-4 flex min-h-5 items-center justify-between gap-2"><span className="inline-flex items-center gap-2 text-xs font-medium text-muted sm:text-xs"><Icon value={card.icon} size={16} />{card.title}</span><Icon value={ArrowUpRight01Icon} size={15} className="shrink-0 text-muted group-hover:text-ink" /></div>
        <div className="mb-3 flex flex-wrap items-center gap-2"><p className="text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">{card.value}<span className="ml-1.5 text-xs font-normal text-muted">เรื่อง</span></p><span className={`rounded-full px-2 py-1 text-xs font-medium ${card.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-primary/10 text-ink"}`}>{card.badge}</span></div>
        <SegmentMeter value={card.value} total={data.total} /><p className="mt-2 text-xs text-muted">{card.description}</p>
      </Link>)}
    </section>

    <div className="grid gap-4 min-[75rem]:grid-cols-[minmax(0,1.75fr)_minmax(280px,1fr)]">
      <section className={`${panelClass} min-w-0`}>
        <PanelHeading title="จำนวนเรื่องแจ้งรายเดือน" action={<button type="button" onClick={() => setSelection({ year, month: null })} aria-pressed={month === null} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs ${month === null ? "border-primary/20 bg-primary/10 text-ink" : "border-line text-muted hover:text-ink"} ${focusClass}`}>ทั้งปี</button>} />
        <label className="mb-4 flex items-center justify-between gap-3 text-xs text-muted sm:hidden">ช่วงสรุป<select aria-label="เดือนที่สรุป" value={month ?? ""} onChange={event => setSelection({ year, month: event.target.value === "" ? null : Number(event.target.value) })} className="rounded-lg border border-line px-3 py-2.5 text-sm text-ink focus-visible:outline-2 focus-visible:outline-primary"><option value="">ทั้งปี</option>{MONTH_LABELS.map((label, index) => <option key={label} value={index}>{label} {year + 543}</option>)}</select></label>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-muted">ทั้งหมด <span className="font-medium text-ink">{data.annualTotal} เรื่อง</span> ในปี {year + 543}</p><div className="flex items-center gap-3 text-xs text-muted"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-primary" />เสร็จสิ้น</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm border border-primary/40 bg-primary/10" />สถานะอื่น</span></div></div>
        <MonthlyTicketChart rows={data.monthly} year={year} selectedMonth={month} onSelect={value => setSelection({ year, month: month === value ? null : value })} />
        <p className="mt-2 text-xs text-muted">เลื่อนกราฟเพื่อดูทุกเดือน แล้วกดเดือนเพื่อเลือกช่วง · นับตามวันที่แจ้งในเขตเวลาไทย</p>
      </section>
      <section className={panelClass}>
        <PanelHeading title="สถานะงานซ่อม" action={<Icon value={Analytics01Icon} className="text-muted" />} />
        <div className="flex flex-wrap items-center justify-center gap-4"><StatusDonut counts={data.counts} total={data.total} rate={data.completionRate} /><div className="min-w-28 flex-1 space-y-3">{statuses.map(status => <Link key={status} href={href(status)} className={`flex items-center justify-between gap-3 rounded-sm text-xs ${focusClass}`}><span className="flex items-center gap-2 text-muted"><span className={`h-2 w-2 rounded-full ${STATUS_DOTS[status]}`} />{STATUS_LABELS[status]}</span><span className="font-medium tabular-nums text-ink">{data.counts[status]}</span></Link>)}</div></div>
        <div className="mt-5 border-t border-line pt-4"><p className="text-xs text-muted">อัตราเสร็จสิ้นเทียบกับเรื่องแจ้งทั้งหมด รวมเรื่องยกเลิก</p><Link href={href(data.counts.pending ? "pending" : data.counts.in_progress ? "in_progress" : undefined)} className={`mt-3 flex items-center justify-between rounded-lg bg-background px-3 py-2.5 text-xs font-medium text-ink ${focusClass}`}><span>{data.counts.pending ? `รอรับเรื่อง ${data.counts.pending} เรื่อง` : data.counts.in_progress ? `กำลังดำเนินการ ${data.counts.in_progress} เรื่อง` : "ไม่มีงานค้างในช่วงนี้"}</span><Icon value={ArrowRight01Icon} size={15} /></Link></div>
      </section>
    </div>

    <div className="grid gap-4 md:grid-cols-2 min-[75rem]:grid-cols-[1fr_1.15fr_1fr]">
      <section className={panelClass}>
        <PanelHeading title="อาคารที่มีการแจ้งมาก" action={reportsLink} />
        <div className="space-y-4">{data.buildings.slice(0, 4).map(([building, count]) => <Link key={building} href={href(undefined, building)} className={`block rounded-lg ${focusClass}`}><div className="mb-2 flex items-center justify-between gap-3 text-xs"><span className="flex items-center gap-2"><Icon value={Building03Icon} size={16} className="text-muted" />{building}</span><span className="tabular-nums text-muted">{count} เรื่อง · {share(count)}%</span></div><svg preserveAspectRatio="none" viewBox="0 0 300 6" className="h-1.5 w-full" aria-hidden="true"><rect width="300" height="6" rx="3" className="fill-background" /><rect width={data.total ? count / data.total * 300 : 0} height="6" rx="3" className="fill-primary" /></svg></Link>)}{!data.buildings.length && <p className="py-8 text-center text-sm text-muted">ไม่มีเรื่องแจ้งในช่วงนี้</p>}</div>
      </section>
      <section className={panelClass}>
        <PanelHeading title="กิจกรรมล่าสุด" action={<span className="text-xs text-muted">{period}</span>} />
        <div className="divide-y divide-line">{data.activities.map(activity => <Link key={`${activity.ticketId}-${activity.event.id}`} href={`/admin/tickets/${activity.ticketId}`} className={`flex gap-3 rounded-sm py-2 first:pt-0 last:pb-0 ${focusClass}`}><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${STATUS_DOTS[activity.event.status]}`} /><div className="min-w-0"><p className="line-clamp-1 text-xs font-medium leading-relaxed">{activity.event.message}</p><p className="mt-1 truncate text-xs text-muted">{activity.ticketNumber} · {activity.title}</p><time dateTime={activity.event.at} className="mt-1 block text-xs text-muted">{formatDate(activity.event.at, true)}</time></div></Link>)}{!data.activities.length && <p className="py-8 text-center text-sm text-muted">ยังไม่มีกิจกรรมจากผู้ดูแลในช่วงนี้</p>}</div>
      </section>
      <section className={`${panelClass} md:col-span-2 min-[75rem]:col-span-1`}>
        <PanelHeading title="งานที่ต้องติดตาม" action={<span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium">{data.queue.length} เรื่อง</span>} />
        {data.queue.length ? <><div className="space-y-3">{data.queue.slice(0, 3).map(ticket => <Link key={ticket.id} href={`/admin/tickets/${ticket.id}`} className={`block rounded-xl border border-line bg-background/50 p-3 transition-colors hover:border-primary ${focusClass}`}><div className="mb-2 flex items-center justify-between gap-2"><span className="text-xs text-muted">{ticket.number ?? ticket.id}</span><span className="text-xs font-medium">{STATUS_LABELS[ticket.status]}</span></div><p className="line-clamp-1 text-xs font-medium">{ticket.title}</p><p className="mt-1 text-xs text-muted">{ticket.building} · {formatDate(ticket.createdAt)}</p></Link>)}</div><p className="mt-4 text-xs text-muted">เรื่องรอรับอยู่ก่อน แล้วเรียงตามวันที่แจ้งเก่าสุด</p></> : <div className="flex min-h-40 flex-col items-center justify-center rounded-xl bg-emerald-50/60 p-4 text-center"><Icon value={CheckmarkCircle02Icon} size={28} className="mb-3 text-emerald-600" /><p className="text-sm font-medium">ไม่มีงานค้างในช่วงนี้</p><p className="mt-1 text-xs text-muted">เลือกเดือนอื่นหรือดูเรื่องแจ้งทั้งหมดได้</p></div>}
      </section>
    </div>

    <section className="pt-1"><PanelHeading title="เรื่องแจ้งล่าสุด" action={<Link href={href()} className={`inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink ${focusClass}`}>ดูทั้งหมด<Icon value={ArrowRight01Icon} size={14} /></Link>} /><TicketTable tickets={data.latest} /></section>
    <p className="text-xs text-muted">กดอัปเดตข้อมูลเพื่อดูเรื่องแจ้งและสถานะล่าสุด</p>
  </div>;
}



