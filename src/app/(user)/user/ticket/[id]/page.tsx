import Link from "next/link";
import { notFound } from "next/navigation";
import { getOwnReports } from "../../../../../lib/user-reports";
import { TicketHistory, TicketInformation } from "../../../../../components/tickets";
import { UserTicketProgress } from "../../../../../components/user-ticket-card";
import { RefreshReports } from "../../../../../components/refresh-reports";
import { formatDate } from "../../../../../lib/tickets";

export default async function TicketDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ sent?: string }> }) {
  const { id } = await params;
  const [ticket] = await getOwnReports(id);
  if (!ticket) notFound();
  const sent = (await searchParams).sent === "1";
  return <div className="mx-auto mt-8 max-w-3xl p-4 sm:p-6">
    <Link href="/user" className="mb-5 inline-block text-sm font-medium text-ink hover:underline">← กลับไปเรื่องของฉัน</Link>
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-semibold">รายละเอียดใบแจ้งซ่อม</h1><p className="mt-2 text-xs text-muted">อัปเดตล่าสุด {formatDate(ticket.updatedAt, true)}</p></div><RefreshReports label="อัปเดตสถานะ" /></div>
    {sent && <p role="status" className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">ส่งเรื่องแจ้งซ่อมสำเร็จแล้ว หมายเลข {ticket.number} · ติดตามความคืบหน้าได้ที่หน้านี้</p>}
    <div className="space-y-6"><section aria-label="ความคืบหน้าเรื่องแจ้ง" className="rounded-2xl border border-line bg-surface p-5 sm:p-6"><UserTicketProgress status={ticket.status} /></section><TicketInformation ticket={ticket} /><TicketHistory ticket={ticket} /></div>
  </div>;
}
