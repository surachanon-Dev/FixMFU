"use client";

import Link from "next/link";
import { DemoNotice, LoadingTickets, TicketTable } from "../../../../components/tickets";
import { useTickets } from "../../../../lib/ticket-store";
import { STATUS_LABELS, type TicketStatus } from "../../../../lib/tickets";

const cards: { status?: TicketStatus; label: string; color: string }[] = [
  { label: "เรื่องแจ้งทั้งหมด", color: "text-ink" },
  { status: "pending", label: STATUS_LABELS.pending, color: "text-amber-700" },
  { status: "in_progress", label: STATUS_LABELS.in_progress, color: "text-ink" },
  { status: "completed", label: STATUS_LABELS.completed, color: "text-emerald-700" },
  { status: "cancelled", label: STATUS_LABELS.cancelled, color: "text-muted" },
];

export default function AdminDashboardPage() {
  const tickets = useTickets();
  if (!tickets) return <LoadingTickets />;
  const latest = [...tickets].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const waiting = tickets.filter(ticket => ticket.status === "pending").length;
  return <div className="p-4 sm:p-6 lg:p-8">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-sm font-medium text-ink">ศูนย์จัดการงานซ่อม</p><h1 className="text-3xl font-semibold">ภาพรวมเรื่องแจ้ง</h1><p className="mt-2 text-muted">ติดตามจำนวนเรื่องและสถานะการดำเนินงานทั้งหมด</p></div><Link href="/admin/tickets" className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-ink hover:bg-primary-hover">จัดการเรื่องแจ้ง →</Link></div>
    <DemoNotice />
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{cards.map(card => <Link key={card.label} href={card.status ? `/admin/tickets?status=${card.status}` : "/admin/tickets"} className="rounded-xl border border-line bg-surface p-5 shadow-sm transition hover:border-primary hover:shadow-md"><p className="text-sm font-medium text-muted">{card.label}</p><p className={`mt-3 text-4xl font-semibold tabular-nums ${card.color}`}>{card.status ? tickets.filter(ticket => ticket.status === card.status).length : tickets.length}<span className="ml-2 text-sm font-normal text-muted">เรื่อง</span></p></Link>)}</div>
    {waiting > 0 && <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4"><p className="text-sm text-amber-900">มี {waiting} เรื่องรอรับเรื่องและประสานงานช่าง</p><Link href="/admin/tickets?status=pending" className="text-sm font-medium text-amber-900 underline underline-offset-4">ดูเรื่องที่รอรับ</Link></div>}
    <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">เรื่องแจ้งล่าสุด</h2><Link href="/admin/tickets" className="text-sm font-medium text-ink hover:underline">ดูทั้งหมด →</Link></div>
    <TicketTable tickets={latest} />
  </div>;
}
