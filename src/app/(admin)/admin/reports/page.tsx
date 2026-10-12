"use client";

import { useState } from "react";
import { DemoNotice, LoadingTickets, inputClass } from "../../../../components/tickets";
import { useTickets } from "../../../../lib/ticket-store";
import { STATUS_LABELS, countBy, formatMonth, ticketMonth, type TicketStatus } from "../../../../lib/tickets";

function Ranking({ title, label, rows }: { title: string; label: string; rows: [string, number][] }) {
  return <section className="rounded-xl border border-line bg-surface p-6"><h2 className="mb-1 text-lg font-semibold">{title}</h2><p className="mb-5 text-sm text-muted">เรียงตามจำนวนเรื่องแจ้งในช่วงที่เลือก</p>
    {rows.length ? <table className="w-full text-left text-sm"><thead><tr className="border-b text-muted"><th scope="col" className="pb-3 font-medium">{label}</th><th scope="col" className="pb-3 text-right font-medium">จำนวนเรื่อง</th></tr></thead><tbody className="divide-y divide-line">{rows.map(([name, count], index) => <tr key={name}><td className="py-4"><span className="mr-3 text-muted">{index + 1}.</span>{name}</td><td className="py-4 text-right font-semibold text-ink">{count}</td></tr>)}</tbody></table> : <p className="py-8 text-center text-muted">ไม่มีข้อมูลในช่วงที่เลือก</p>}
  </section>;
}

export default function AdminReportsPage() {
  const tickets = useTickets();
  const [month, setMonth] = useState("");
  if (!tickets) return <LoadingTickets />;
  const months = [...new Set(tickets.map(ticketMonth))].sort().reverse();
  const selected = tickets.filter(ticket => !month || ticketMonth(ticket) === month);
  const statuses = Object.keys(STATUS_LABELS) as TicketStatus[];
  return <div className="p-4 sm:p-6 lg:p-8">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-semibold">รายงานสรุป</h1><p className="mt-2 text-muted">สรุปจำนวนเรื่องรายเดือน ประเภทปัญหา และอาคารที่มีการแจ้งมาก</p></div><label className="text-sm font-medium">ช่วงรายงาน<select value={month} onChange={event => setMonth(event.target.value)} className={`${inputClass} mt-2 min-w-48`}><option value="">ทุกเดือน</option>{months.map(value => <option key={value} value={value}>{formatMonth(value)}</option>)}</select></label></div>
    <DemoNotice />
    <div className="mb-6 rounded-xl border border-line bg-primary/10 p-5"><p className="text-sm text-ink">{month ? formatMonth(month) : "ทุกเดือน"}</p><p className="mt-1 text-3xl font-semibold text-ink">{selected.length}<span className="ml-2 text-base font-normal">เรื่องแจ้ง</span></p><p className="mt-2 text-xs text-ink">นับตามวันที่แจ้ง รวมเรื่องที่ยกเลิก · สถานะเป็นสถานะปัจจุบันของเรื่อง</p></div>
    <section className="mb-6 overflow-x-auto rounded-xl border border-line bg-surface p-6"><h2 className="mb-5 text-lg font-semibold">จำนวนเรื่องแจ้งรายเดือน</h2><table className="w-full text-left text-sm"><thead><tr className="border-b text-muted"><th scope="col" className="whitespace-nowrap pb-3 pr-4 font-medium">เดือน</th><th scope="col" className="whitespace-nowrap px-3 pb-3 text-right font-medium">ทั้งหมด</th>{statuses.map(status => <th key={status} scope="col" className="whitespace-nowrap px-3 pb-3 text-right font-medium">{STATUS_LABELS[status]}</th>)}</tr></thead><tbody className="divide-y divide-line">{months.filter(value => !month || month === value).map(value => {
      const group = selected.filter(ticket => ticketMonth(ticket) === value);
      return <tr key={value}><th scope="row" className="whitespace-nowrap py-4 pr-4 font-medium">{formatMonth(value)}</th><td className="px-3 py-4 text-right font-semibold">{group.length}</td>{statuses.map(status => <td key={status} className="px-3 py-4 text-right">{group.filter(ticket => ticket.status === status).length}</td>)}</tr>;
    })}</tbody></table>{selected.length === 0 && <p className="py-6 text-center text-muted">ไม่มีข้อมูลในช่วงที่เลือก</p>}</section>
    <div className="grid gap-6 lg:grid-cols-2"><Ranking title="ประเภทปัญหาที่พบบ่อย" label="ประเภทปัญหา" rows={countBy(selected, "category")} /><Ranking title="อาคารที่มีการแจ้งมาก" label="อาคาร" rows={countBy(selected, "building")} /></div>
  </div>;
}
