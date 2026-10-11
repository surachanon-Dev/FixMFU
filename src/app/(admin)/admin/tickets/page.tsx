"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { DemoNotice, LoadingTickets, TicketTable, inputClass } from "../../../../components/tickets";
import { useTickets } from "../../../../lib/ticket-store";
import { STATUS_LABELS } from "../../../../lib/tickets";

function TicketList() {
  const tickets = useTickets();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [building, setBuilding] = useState("");
  const [category, setCategory] = useState("");
  if (!tickets) return <LoadingTickets />;
  const query = search.trim().toLocaleLowerCase("th");
  const filtered = tickets.filter(ticket => (!status || ticket.status === status) && (!building || ticket.building === building) && (!category || ticket.category === category)
    && [ticket.id, ticket.title, ticket.description, ticket.location, ticket.building, ticket.category, ticket.reporter.name].join(" ").toLocaleLowerCase("th").includes(query))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const reset = () => { setSearch(""); setStatus(""); setBuilding(""); setCategory(""); };
  return <div className="p-4 sm:p-6 lg:p-8">
    <h1 className="text-3xl font-semibold">จัดการเรื่องแจ้ง</h1><p className="mb-6 mt-2 text-muted">ค้นหาเรื่องแจ้ง กรองรายการ และเปิดรายละเอียดเพื่อดำเนินการ</p><DemoNotice />
    <div className="mb-6 grid gap-4 rounded-xl border border-line bg-surface p-5 sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-sm font-medium">ค้นหาเรื่องแจ้ง<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="รหัส เรื่อง สถานที่ หรือผู้แจ้ง" className={`${inputClass} mt-2`} /></label>
      <label className="text-sm font-medium">สถานะ<select value={status} onChange={event => setStatus(event.target.value)} className={`${inputClass} mt-2`}><option value="">ทุกสถานะ</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="text-sm font-medium">อาคาร<select value={building} onChange={event => setBuilding(event.target.value)} className={`${inputClass} mt-2`}><option value="">ทุกอาคาร</option>{[...new Set(tickets.map(ticket => ticket.building))].sort().map(value => <option key={value}>{value}</option>)}</select></label>
      <label className="text-sm font-medium">ประเภทปัญหา<select value={category} onChange={event => setCategory(event.target.value)} className={`${inputClass} mt-2`}><option value="">ทุกประเภท</option>{[...new Set(tickets.map(ticket => ticket.category))].sort().map(value => <option key={value}>{value}</option>)}</select></label>
    </div>
    <div className="mb-4 flex items-center justify-between gap-3"><p className="text-sm text-muted">พบ {filtered.length} จาก {tickets.length} เรื่อง</p><button onClick={reset} className="text-sm font-medium text-ink hover:underline">ล้างตัวกรอง</button></div><TicketTable tickets={filtered} />
  </div>;
}

export default function AdminTicketsPage() {
  const searchParams = useSearchParams();
  return <TicketList key={searchParams.toString()} />;
}
