import Link from "next/link";
import { STATUS_LABELS, formatDate, type Ticket, type TicketStatus } from "../lib/tickets";

export const inputClass = "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";
export const buttonClass = "rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50";
const statusColors: Record<TicketStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  in_progress: "border-blue-200 bg-blue-50 text-blue-800",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  cancelled: "border-line bg-background text-muted",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium ${statusColors[status]}`}>{STATUS_LABELS[status]}</span>;
}

export function DemoNotice() {
  return <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">โหมดตัวอย่างฝั่งผู้ดูแล · รายการและการเปลี่ยนสถานะส่วนนี้ยังไม่เชื่อมกับเรื่องจริงที่ผู้ใช้ส่ง</p>;
}

export function LoadingTickets() {
  return <p role="status" className="p-8 text-muted">กำลังโหลดเรื่องแจ้ง…</p>;
}

export function TicketTable({ tickets }: { tickets: Ticket[] }) {
  if (!tickets.length) return <p className="rounded-xl border border-dashed border-line bg-surface p-10 text-center text-muted">ไม่พบเรื่องแจ้งที่ตรงกับเงื่อนไข</p>;
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line bg-surface text-muted"><tr>{["เรื่องแจ้ง", "อาคาร / สถานที่", "ประเภทปัญหา", "สถานะ", "วันที่แจ้ง", "รายละเอียด"].map(label => <th key={label} scope="col" className="whitespace-nowrap px-5 py-4 font-medium">{label}</th>)}</tr></thead>
        <tbody className="divide-y divide-line">{tickets.map(ticket => <tr key={ticket.id} className="hover:bg-primary/10">
          <td className="min-w-56 px-5 py-4"><span className="text-xs text-muted">{ticket.number ?? ticket.id}</span><p className="mt-1 font-medium text-ink">{ticket.title}</p></td>
          <td className="min-w-40 px-5 py-4">{ticket.building}<p className="mt-1 text-xs text-muted">{ticket.location}</p></td>
          <td className="whitespace-nowrap px-5 py-4">{ticket.category}</td>
          <td className="px-5 py-4"><StatusBadge status={ticket.status} /></td>
          <td className="whitespace-nowrap px-5 py-4 text-muted">{formatDate(ticket.createdAt)}</td>
          <td className="whitespace-nowrap px-5 py-4"><Link className="font-medium text-ink hover:underline" href={`/admin/tickets/${ticket.id}`} aria-label={`ดูรายละเอียด ${ticket.number ?? ticket.id}`}>ดูรายละเอียด →</Link></td>
        </tr>)}</tbody>
      </table>
    </div>
  );
}

export function TicketInformation({ ticket, showReporter = false }: { ticket: Ticket; showReporter?: boolean }) {
  return <section className="rounded-xl border border-line bg-surface p-6">
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm text-muted">{ticket.number ?? ticket.id} · แจ้งเมื่อ {formatDate(ticket.createdAt, true)}</p><h2 className="mt-2 text-xl font-semibold text-ink">{ticket.title}</h2></div><StatusBadge status={ticket.status} /></div>
    <dl className="grid gap-5 sm:grid-cols-2">
      <div><dt className="text-sm text-muted">อาคาร / สถานที่</dt><dd className="mt-1 font-medium">{ticket.building} · {ticket.location}</dd></div>
      <div><dt className="text-sm text-muted">ประเภทปัญหา</dt><dd className="mt-1 font-medium">{ticket.category}</dd></div>
      {showReporter && <><div><dt className="text-sm text-muted">ผู้แจ้ง</dt><dd className="mt-1 font-medium">{ticket.reporter.name}</dd></div><div><dt className="text-sm text-muted">ข้อมูลติดต่อ</dt><dd className="mt-1 break-all font-medium">{ticket.reporter.contact}</dd></div></>}
      <div className="sm:col-span-2"><dt className="text-sm text-muted">รายละเอียด</dt><dd className="mt-2 whitespace-pre-wrap rounded-lg bg-background p-4 leading-relaxed">{ticket.description}</dd></div>
    </dl>
    <h3 className="mb-3 mt-6 font-medium">รูปที่ผู้แจ้งแนบ</h3>
    <AttachmentGallery photos={ticket.photos} emptyText="ไม่มีรูปแนบจากผู้แจ้ง" />
    {ticket.status === "completed" && <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4"><h3 className="font-medium text-emerald-900">ผลการแก้ไข</h3><p className="mt-2 whitespace-pre-wrap text-sm text-emerald-900">{ticket.resolution || "ดูรูปผลการแก้ไขที่แนบ"}</p><div className="mt-3"><AttachmentGallery photos={ticket.repairPhotos} emptyText="ไม่มีรูปผลการแก้ไขแนบ" /></div></div>}
    {ticket.status === "cancelled" && <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4"><h3 className="font-medium text-red-900">เหตุผลที่ยกเลิก</h3><p className="mt-2 whitespace-pre-wrap text-sm text-red-800">{ticket.cancellationReason}</p></div>}
  </section>;
}

export function AttachmentGallery({ photos, emptyText }: { photos: Ticket["photos"]; emptyText: string }) {
  if (!photos.length) return <p className="text-sm text-muted">{emptyText}</p>;
  return <div className="grid gap-3 sm:grid-cols-2">{photos.map((photo, index) => <figure key={`${photo.name}-${index}`} className="overflow-hidden rounded-lg border border-line bg-surface">
    {/* Private Storage signed URLs and local demo images bypass the image optimizer. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={photo.dataUrl} alt={photo.name} className="h-48 w-full object-contain" />
    <figcaption className="truncate px-3 py-2 text-xs text-muted">{photo.name}</figcaption>
  </figure>)}</div>;
}

export function TicketHistory({ ticket }: { ticket: Ticket }) {
  return <section className="rounded-xl border border-line bg-surface p-6"><h2 className="mb-5 text-lg font-semibold">ประวัติการดำเนินงาน</h2>
    <ol className="space-y-5">{[...ticket.history].reverse().map(event => <li key={event.id} className="border-l-2 border-line pl-4">
      <div className="flex flex-wrap items-center gap-2"><StatusBadge status={event.status} /><time dateTime={event.at} className="text-xs text-muted">{formatDate(event.at, true)}</time></div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">{event.message}</p><p className="mt-1 text-xs text-muted">โดย {event.actor}</p>
    </li>)}</ol>
  </section>;
}
