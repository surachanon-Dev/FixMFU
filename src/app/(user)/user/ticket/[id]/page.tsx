import Link from "next/link";
import { notFound } from "next/navigation";
import { getOwnReports } from "../../../../../lib/user-reports";
import { TicketHistory, TicketInformation } from "../../../../../components/tickets";

export default async function TicketDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ sent?: string }> }) {
  const { id } = await params;
  const [ticket] = await getOwnReports(id);
  if (!ticket) notFound();
  const sent = (await searchParams).sent === "1";
  return <div className="mx-auto mt-8 max-w-3xl p-4 sm:p-6">
    <Link href="/user" className="mb-5 inline-block text-sm font-medium text-ink hover:underline">← กลับไปเรื่องของฉัน</Link>
    <h1 className="mb-6 text-3xl font-semibold">รายละเอียดใบแจ้งซ่อม</h1>
    {sent && <p role="status" className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">ส่งเรื่องแจ้งซ่อมสำเร็จแล้ว หมายเลข {ticket.number} · ติดตามความคืบหน้าได้ที่หน้านี้</p>}
    <div className="space-y-6"><TicketInformation ticket={ticket} /><TicketHistory ticket={ticket} /></div>
  </div>;
}
