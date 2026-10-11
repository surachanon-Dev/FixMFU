"use client";

import Link from "next/link";
import { useTickets } from "../lib/ticket-store";
import { DEMO_USER_ID, formatDate } from "../lib/tickets";
import { DemoNotice, LoadingTickets, StatusBadge, TicketHistory, TicketInformation } from "./tickets";

export function UserTickets() {
  const tickets = useTickets();
  if (!tickets) return <LoadingTickets />;
  const own = tickets.filter(ticket => ticket.reporter.id === DEMO_USER_ID).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return <div className="mx-auto mt-8 max-w-4xl p-4 sm:p-6">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-semibold">ประวัติการแจ้งซ่อม</h1><p className="mt-2 text-muted">ติดตามสถานะและหมายเหตุจากผู้ดูแลระบบ</p></div><Link href="/user/report" className="rounded-lg bg-primary px-5 py-3 font-medium text-ink hover:bg-primary-hover">แจ้งปัญหาใหม่</Link></div>
    <DemoNotice />
    <div className="space-y-4">{own.map(ticket => <article key={ticket.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-surface p-5 shadow-sm"><div><div className="mb-2 flex items-center gap-3"><span className="text-sm text-muted">{ticket.id}</span><StatusBadge status={ticket.status} /></div><h2 className="font-medium">{ticket.title}</h2><p className="mt-2 text-sm text-muted">แจ้งเมื่อ {formatDate(ticket.createdAt)}</p></div><Link href={`/user/ticket/${ticket.id}`} className="text-sm font-medium text-ink hover:underline">ดูรายละเอียด →</Link></article>)}
      {!own.length && <p className="rounded-xl border border-dashed border-line p-10 text-center text-muted">ยังไม่มีประวัติการแจ้งซ่อม</p>}
    </div>
  </div>;
}

export function UserTicketDetail({ id }: { id: string }) {
  const tickets = useTickets();
  if (!tickets) return <LoadingTickets />;
  const ticket = tickets.find(ticket => ticket.id === id && ticket.reporter.id === DEMO_USER_ID);
  return <div className="mx-auto mt-8 max-w-3xl p-4 sm:p-6">
    <Link href="/user" className="mb-5 inline-block text-sm font-medium text-ink hover:underline">← กลับไปประวัติการแจ้งซ่อม</Link><h1 className="mb-6 text-3xl font-semibold">รายละเอียดใบแจ้งซ่อม</h1><DemoNotice />
    {ticket ? <div className="space-y-6"><TicketInformation ticket={ticket} /><TicketHistory ticket={ticket} /></div> : <p role="alert" className="rounded-xl border border-line bg-surface p-8 text-muted">ไม่พบใบแจ้งซ่อมของคุณ</p>}
  </div>;
}
