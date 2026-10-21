import Link from "next/link";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { ArrowRight01Icon, Calendar03Icon, CheckmarkCircle02Icon, FlashIcon, Location01Icon, Message01Icon, ToolsIcon, Wifi01Icon } from "@hugeicons/core-free-icons";
import { STATUS_LABELS, formatDate, type Ticket } from "../lib/tickets";
import { StatusBadge } from "./tickets";

function Icon({ value, size = 16, className = "" }: { value: IconSvgElement; size?: number; className?: string }) {
  return <HugeiconsIcon icon={value} size={size} strokeWidth={1.6} className={className} aria-hidden="true" />;
}

export function UserTicketProgress({ status }: { status: Ticket["status"] }) {
  if (status === "cancelled") return <p className="rounded-lg bg-background px-4 py-3 text-xs text-muted">เรื่องนี้ยกเลิกแล้ว · ดูเหตุผลได้ในรายละเอียด</p>;
  const current = { pending: 0, in_progress: 1, completed: 2 }[status];
  return <ol aria-label="ความคืบหน้าของเรื่องแจ้ง" className="grid grid-cols-3">
    {[STATUS_LABELS.pending, STATUS_LABELS.in_progress, STATUS_LABELS.completed].map((label, index) => <li key={label} aria-current={index === current ? "step" : undefined} className="relative flex flex-col items-center gap-2 text-center">
      {index < 2 && <span aria-hidden="true" className={`absolute top-3 right-[calc(-50%+14px)] left-[calc(50%+14px)] h-0.5 ${index < current ? "bg-primary" : "bg-line"}`} />}
      <span aria-hidden="true" className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-xs ${index <= current ? "bg-primary text-ink" : "border border-line bg-surface text-muted"} ${index === current ? "ring-4 ring-primary/15" : ""}`}>{index < current || status === "completed" ? <Icon value={CheckmarkCircle02Icon} size={14} /> : index + 1}</span>
      <span className={`text-xs ${index === current ? "font-medium text-ink" : "text-muted"}`}>{label}</span>
    </li>)}
  </ol>;
}

export default function UserTicketCard({ ticket }: { ticket: Ticket }) {
  const categoryIcon = ticket.category === "ไฟฟ้า" ? FlashIcon : ticket.category === "อินเทอร์เน็ต" ? Wifi01Icon : ToolsIcon;
  const latest = ticket.history.filter(event => event.actor === "ผู้ดูแลระบบ").reverse().sort((a, b) => Date.parse(b.at) - Date.parse(a.at))[0];
  const photo = ticket.photos[0];
  return <article className="rounded-2xl border border-line bg-surface p-5 shadow-xs transition-colors hover:border-primary/50 sm:p-6">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-medium tracking-wide text-muted">{ticket.number ?? ticket.id}</span><StatusBadge status={ticket.status} /></div>
    <div className="flex items-start gap-4">
      {photo ? <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-line sm:h-18 sm:w-18">
        {/* Private Storage images use expiring signed URLs. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.dataUrl} alt={`รูปแนบ: ${photo.name}`} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
      </div> : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-ink"><Icon value={categoryIcon} size={23} /></span>}
      <div className="min-w-0"><p className="mb-1 break-words text-xs text-muted">{ticket.category}</p><h3 className="break-words text-base font-medium leading-relaxed">{ticket.title}</h3><p className="mt-1 line-clamp-1 text-sm text-muted">{ticket.description}</p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted"><span className="inline-flex items-center gap-1.5"><Icon value={Location01Icon} size={14} />{ticket.building} · {ticket.location}</span><span className="inline-flex items-center gap-1.5"><Icon value={Calendar03Icon} size={14} />{formatDate(ticket.createdAt)}</span></div>
      </div>
    </div>
    {latest && <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-background/70 px-3 py-2.5"><Icon value={Message01Icon} className="mt-0.5 shrink-0 text-muted" /><p className="line-clamp-2 text-xs leading-relaxed text-muted"><span className="mr-1 font-medium text-ink">อัปเดตจากผู้ดูแล:</span>{latest.message}</p></div>}
    <div className="mt-5 border-t border-line pt-5"><UserTicketProgress status={ticket.status} /></div>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted">อัปเดต {formatDate(ticket.updatedAt, true)}</p><Link href={`/user/ticket/${ticket.id}`} aria-label={`ดูรายละเอียด ${ticket.number ?? ticket.id}`} className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-ink transition-colors hover:bg-primary/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">ดูรายละเอียด<Icon value={ArrowRight01Icon} size={14} /></Link></div>
  </article>;
}
