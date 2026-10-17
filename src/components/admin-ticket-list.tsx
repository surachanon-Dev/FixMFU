"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TicketTable, inputClass } from "./tickets";
import { RefreshReports } from "./refresh-reports";
import { STATUS_LABELS, formatMonth, type Ticket } from "../lib/tickets";
import { filterTicketsByPeriod } from "../lib/dashboard";

function TicketList({ tickets }: { tickets: Ticket[] }) {

  const searchParams = useSearchParams();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const status = searchParams.get("status") ?? "";
  const setStatus = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("status", value);
    else params.delete("status");
    router.replace(`/admin/tickets${params.size ? `?${params}` : ""}`, { scroll: false });
  };
  const [building, setBuilding] = useState(searchParams.get("building") ?? "");
  const [category, setCategory] = useState("");

  const query = search.trim().toLocaleLowerCase("th");
  const year = searchParams.get("year") ?? "";
  const month = searchParams.get("month") ?? "";
  const filtered = filterTicketsByPeriod(tickets, year, month).filter(ticket => (!status || ticket.status === status) && (!building || ticket.building === building) && (!category || ticket.category === category)
    && [ticket.number ?? ticket.id, ticket.title, ticket.description, ticket.location, ticket.building, ticket.category, ticket.reporter.name].join(" ").toLocaleLowerCase("th").includes(query))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const reset = () => { setSearch(""); setBuilding(""); setCategory(""); router.replace("/admin/tickets", { scroll: false }); };
  return <div className="p-4 sm:p-6 lg:p-8">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-semibold">จัดการเรื่องแจ้ง</h1><RefreshReports /></div><p className="mb-6 mt-2 text-muted">ค้นหาเรื่องแจ้ง กรองรายการ และเปิดรายละเอียดเพื่อดำเนินการ</p>
    {(year || month) && <p className="mb-4 rounded-lg border border-line bg-primary/10 px-4 py-3 text-sm">ช่วงจาก Dashboard: {/^\d{4}-\d{2}$/.test(month) && Number(month.slice(5)) >= 1 && Number(month.slice(5)) <= 12 ? formatMonth(month) : /^\d{4}$/.test(year) ? `ปี ${Number(year) + 543}` : "ช่วงที่เลือก"} · กดล้างตัวกรองเพื่อดูทุกช่วง</p>}
    <div className="mb-6 grid gap-4 rounded-xl border border-line bg-surface p-5 sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-sm font-medium">ค้นหาเรื่องแจ้ง<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="รหัส เรื่อง สถานที่ หรือผู้แจ้ง" className={`${inputClass} mt-2`} /></label>
      <label className="text-sm font-medium">สถานะ<select value={status} onChange={event => setStatus(event.target.value)} className={`${inputClass} mt-2`}><option value="">ทุกสถานะ</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="text-sm font-medium">อาคาร<select value={building} onChange={event => setBuilding(event.target.value)} className={`${inputClass} mt-2`}><option value="">ทุกอาคาร</option>{[...new Set(tickets.map(ticket => ticket.building))].sort().map(value => <option key={value}>{value}</option>)}</select></label>
      <label className="text-sm font-medium">ประเภทปัญหา<select value={category} onChange={event => setCategory(event.target.value)} className={`${inputClass} mt-2`}><option value="">ทุกประเภท</option>{[...new Set(tickets.map(ticket => ticket.category))].sort().map(value => <option key={value}>{value}</option>)}</select></label>
    </div>
    <div className="mb-4 flex items-center justify-between gap-3"><p className="text-sm text-muted">พบ {filtered.length} จาก {tickets.length} เรื่อง</p><button onClick={reset} className="text-sm font-medium text-ink hover:underline">ล้างตัวกรอง</button></div><TicketTable tickets={filtered} />
  </div>;
}

export default function AdminTicketList({ tickets }: { tickets: Ticket[] }) {
  const searchParams = useSearchParams();
  return <TicketList key={searchParams.get("building") ?? ""} tickets={tickets} />;
}
