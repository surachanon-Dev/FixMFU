"use client";

import { useState } from "react";
import Link from "next/link";
import { buttonClass, inputClass } from "./tickets";
import { RefreshReports } from "./refresh-reports";
import { STATUS_LABELS, countBy, formatMonth, ticketMonth, type Ticket, type TicketStatus } from "../lib/tickets";
import { adminSummaryCsv } from "../lib/admin-ticket-view";

const focusClass = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary";
const statuses = Object.keys(STATUS_LABELS) as TicketStatus[];

function ticketHref(month: string, field?: string, value?: string) {
  const params = new URLSearchParams();
  if (month) params.set("month", month);
  if (field && value) params.set(field, value);
  return `/admin/tickets${params.size ? `?${params}` : ""}`;
}

function Ranking({ title, label, rows, field, month }: { title: string; label: string; rows: [string, number][]; field: "building" | "category"; month: string }) {
  return <section className="min-w-0 rounded-2xl border border-line bg-surface p-5 sm:p-6"><h2 className="mb-1 text-lg font-semibold">{title}</h2><p className="mb-5 text-sm text-muted">เรียงตามจำนวนเรื่อง · กดชื่อเพื่อดูรายการ</p>
    {rows.length ? <table className="w-full table-fixed text-left text-sm"><caption className="sr-only">{title} {month ? formatMonth(month) : "ทุกเดือน"}</caption><thead><tr className="border-b border-line text-muted"><th scope="col" className="w-2/3 pb-3 font-medium">{label}</th><th scope="col" className="whitespace-nowrap pb-3 text-right font-medium">จำนวนเรื่อง</th></tr></thead><tbody className="divide-y divide-line">{rows.map(([name, count], index) => <tr key={name}><th scope="row" className="break-words py-4 pr-3 font-normal"><Link href={ticketHref(month, field, name)} className={`rounded-sm hover:underline ${focusClass}`}><span className="mr-3 text-muted">{index + 1}.</span>{name}<span className="sr-only"> ดูเรื่องแจ้ง</span></Link></th><td className="py-4 text-right font-semibold tabular-nums text-ink">{count}</td></tr>)}</tbody></table> : <p className="py-8 text-center text-muted">ยังไม่มีข้อมูลในช่วงที่เลือก</p>}
  </section>;
}

export default function AdminReports({ tickets }: { tickets: Ticket[] }) {
  const [month, setMonth] = useState("");
  const months = [...new Set(tickets.map(ticketMonth))].sort().reverse();
  const selected = tickets.filter(ticket => !month || ticketMonth(ticket) === month);
  const counts = Object.fromEntries(statuses.map(status => [status, selected.filter(ticket => ticket.status === status).length])) as Record<TicketStatus, number>;
  const monthlyRows = months.filter(value => !month || month === value).map(value => {
    const group = selected.filter(ticket => ticketMonth(ticket) === value);
    return { month: value, total: group.length, counts: statuses.map(status => group.filter(ticket => ticket.status === status).length) };
  });
  const categoryRows = countBy(selected, "category");
  const buildingRows = countBy(selected, "building");
  const download = () => {
    const csv = adminSummaryCsv([
      ["รายงาน FixMFU", month ? formatMonth(month) : "ทุกเดือน"],
      ["นับตามวันที่แจ้งในเขตเวลาไทย รวมเรื่องยกเลิก สถานะเป็นสถานะปัจจุบัน"],
      [], ["เดือน", "ทั้งหมด", ...statuses.map(status => STATUS_LABELS[status])],
      ...monthlyRows.map(row => [formatMonth(row.month), row.total, ...row.counts]),
      [], ["ประเภทปัญหา", "จำนวนเรื่อง"], ...categoryRows,
      [], ["อาคาร", "จำนวนเรื่อง"], ...buildingRows,
    ]);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `FixMFU-summary-${month || "all"}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <div className="p-4 sm:p-6 lg:p-8">
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-semibold">รายงานสรุป</h1><p className="mt-2 text-muted">ดูแนวโน้มงานซ่อม และเปิดรายการจากตัวเลขหรือชื่ออาคารได้</p></div><RefreshReports /></div>
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-line bg-surface p-4 sm:p-5"><label className="w-full text-sm font-medium sm:w-auto">ช่วงรายงาน<select value={month} onChange={event => setMonth(event.target.value)} className={`${inputClass} mt-2 sm:min-w-56`}><option value="">ทุกเดือน</option>{months.map(value => <option key={value} value={value}>{formatMonth(value)}</option>)}</select></label><div className="flex flex-wrap items-center gap-2">{month && <button type="button" onClick={() => setMonth("")} className={`min-h-11 rounded-lg border border-line px-4 text-sm hover:bg-background ${focusClass}`}>ดูทุกเดือน</button>}<button type="button" onClick={download} disabled={!selected.length} className={`${buttonClass} min-h-11 ${focusClass}`}>ดาวน์โหลด CSV</button></div></div>
    <div className="mb-5 rounded-2xl border border-primary/20 bg-primary/10 p-5"><p className="text-sm text-ink">{month ? formatMonth(month) : "ทุกเดือน"}</p><p role="status" aria-live="polite" className="mt-1 text-3xl font-semibold text-ink">{selected.length}<span className="ml-2 text-base font-normal">เรื่องแจ้ง</span></p><p className="mt-2 text-xs text-ink">นับตามวันที่แจ้งในเขตเวลาไทย รวมเรื่องยกเลิก · สถานะเป็นสถานะปัจจุบันของเรื่อง</p><p className="mt-1 text-xs text-ink">ไฟล์ CSV มีเฉพาะข้อมูลสรุป ไม่รวมชื่อผู้แจ้ง ข้อมูลติดต่อ หรือรูปแนบ</p></div>
    <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">{statuses.map(status => <Link key={status} href={ticketHref(month, "status", status)} className={`rounded-xl border border-line bg-surface p-4 hover:border-primary ${focusClass}`}><p className="text-xs text-muted">{STATUS_LABELS[status]}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{counts[status]}<span className="ml-2 text-xs font-normal text-muted">เรื่อง</span></p><span className="mt-2 block text-xs text-muted">ดูรายการ →</span></Link>)}</div>
    <section className="mb-6 min-w-0 rounded-2xl border border-line bg-surface p-5 sm:p-6"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-semibold">จำนวนเรื่องแจ้งรายเดือน</h2><p className="text-xs text-muted lg:hidden">เลื่อนตารางแนวนอนเพื่อดูทุกสถานะ</p></div><div className="overflow-x-auto rounded-lg focus-visible:outline-2 focus-visible:outline-primary" tabIndex={0} role="region" aria-label="ตารางจำนวนเรื่องรายเดือน เลื่อนแนวนอนได้"><table className="w-full text-left text-sm"><caption className="sr-only">จำนวนเรื่องแจ้งรายเดือน แยกตามสถานะปัจจุบัน</caption><thead><tr className="border-b border-line text-muted"><th scope="col" className="whitespace-nowrap pb-3 pr-4 font-medium">เดือน</th><th scope="col" className="whitespace-nowrap px-3 pb-3 text-right font-medium">ทั้งหมด</th>{statuses.map(status => <th key={status} scope="col" className="whitespace-nowrap px-3 pb-3 text-right font-medium">{STATUS_LABELS[status]}</th>)}</tr></thead><tbody className="divide-y divide-line">{monthlyRows.map(row => <tr key={row.month}><th scope="row" className="whitespace-nowrap py-4 pr-4 font-medium"><Link href={ticketHref(row.month)} className={`rounded-sm hover:underline ${focusClass}`}>{formatMonth(row.month)}</Link></th><td className="px-3 py-4 text-right font-semibold tabular-nums">{row.total}</td>{row.counts.map((count, index) => <td key={statuses[index]} className="px-3 py-4 text-right tabular-nums"><Link href={ticketHref(row.month, "status", statuses[index])} className={`inline-flex min-h-11 min-w-11 items-center justify-end rounded-lg px-2 hover:bg-background ${focusClass}`} aria-label={`${formatMonth(row.month)} ${STATUS_LABELS[statuses[index]]} ${count} เรื่อง ดูรายการ`}>{count}</Link></td>)}</tr>)}</tbody></table></div>{selected.length === 0 && <p className="py-8 text-center text-sm text-muted">{tickets.length ? "ไม่มีข้อมูลในช่วงที่เลือก ลองเลือกเดือนอื่น" : "เมื่อมีผู้ใช้ส่งเรื่อง รายงานจะเริ่มสรุปข้อมูลให้ที่นี่"}</p>}</section>
    <div className="grid gap-5 xl:grid-cols-2"><Ranking title="ประเภทปัญหาที่พบบ่อย" label="ประเภทปัญหา" rows={categoryRows} field="category" month={month} /><Ranking title="อาคารที่มีการแจ้งมาก" label="อาคาร" rows={buildingRows} field="building" month={month} /></div>
  </div>;
}
