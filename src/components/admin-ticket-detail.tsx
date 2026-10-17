import Link from "next/link";
import { randomUUID } from "node:crypto";
import type { Ticket } from "../lib/tickets";
import { TicketHistory, TicketInformation } from "./tickets";
import { RefreshReports } from "./refresh-reports";
import { AdminTicketActions } from "./admin-ticket-actions";

export default function AdminTicketDetail({ ticket }: { ticket: Ticket }) {
  return <div className="p-4 sm:p-6 lg:p-8">
    <Link href="/admin/tickets" className="mb-5 inline-block text-sm font-medium text-ink hover:underline">← กลับไปจัดการเรื่องแจ้ง</Link>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-semibold">รายละเอียดเรื่องแจ้ง</h1><RefreshReports /></div>
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,0.7fr)]">
      <div className="min-w-0 space-y-6"><TicketInformation ticket={ticket} showReporter /><TicketHistory ticket={ticket} /></div>
      <AdminTicketActions key={ticket.id} ticket={ticket} requestId={randomUUID()} />
    </div>
  </div>;
}
