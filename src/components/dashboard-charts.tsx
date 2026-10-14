"use client";

import { useId } from "react";
import { MONTH_LABELS, type DashboardMonth } from "../lib/dashboard";
import { STATUS_LABELS, type TicketStatus } from "../lib/tickets";

export const STATUS_STROKES: Record<TicketStatus, string> = { pending: "stroke-primary", in_progress: "stroke-ink", completed: "stroke-emerald-500", cancelled: "stroke-line" };
export const STATUS_DOTS: Record<TicketStatus, string> = { pending: "bg-primary", in_progress: "bg-ink", completed: "bg-emerald-500", cancelled: "bg-line" };

export function SegmentMeter({ value, total }: { value: number; total: number }) {
  const filled = total ? Math.round(value / total * 40) : 0;
  return <svg preserveAspectRatio="none" viewBox="0 0 200 18" className="h-5 w-full text-primary" aria-hidden="true">{Array.from({ length: 40 }, (_, index) => <rect key={index} x={index * 5} y={1} width={2} height={16} rx={1} className={index < filled ? "fill-current" : "fill-line"} />)}</svg>;
}

export function MonthlyTicketChart({ rows, year, selectedMonth, onSelect }: { rows: DashboardMonth[]; year: number; selectedMonth: number | null; onSelect: (month: number) => void }) {
  const id = useId();
  const maximum = Math.max(4, Math.ceil(Math.max(...rows.map(row => row.total)) / 4) * 4);
  const baseline = 210;
  const scale = (value: number) => value / maximum * 176;
  return <>
    <div className="overflow-x-auto pb-1">
      <svg viewBox="0 0 660 256" className="w-full" role="group" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}>
        <title id={`${id}-title`}>จำนวนเรื่องแจ้งรายเดือน ปี {year + 543}</title><desc id={`${id}-description`}>สีส้มคือเรื่องที่มีสถานะเสร็จสิ้น ลายเส้นคือสถานะอื่น กดเดือนหรือใช้ Enter และ Space เพื่อเลือกช่วงสรุป</desc>
        <defs><pattern id={`${id}-stripe`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" className="fill-primary/10" /><line x1="0" x2="0" y1="0" y2="5" className="stroke-primary/40" strokeWidth="1.5" /></pattern></defs>
        {Array.from({ length: 5 }, (_, index) => {
          const value = maximum / 4 * index;
          const y = baseline - scale(value);
          return <g key={value} aria-hidden="true"><line x1="36" x2="650" y1={y} y2={y} className="stroke-line" strokeDasharray={index ? "3 5" : undefined} /><text x="24" y={y + 4} textAnchor="end" className="fill-muted text-[18px] sm:text-[11px]">{value}</text></g>;
        })}
        {rows.map((row, index) => {
          const x = 43 + index * 51;
          const completedHeight = scale(row.completed);
          const otherHeight = scale(row.total - row.completed);
          const active = selectedMonth === index;
          const label = `${MONTH_LABELS[index]} ${year + 543}: ทั้งหมด ${row.total} เรื่อง เสร็จสิ้น ${row.completed} เรื่อง`;
          return <g key={index} role="button" tabIndex={0} aria-label={label} aria-pressed={active} className="group cursor-pointer outline-none" onClick={() => onSelect(index)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(index); } }}>
            <title>{label}</title><rect x={x - 4} y={18} width="48" height="223" rx="8" className={active ? "fill-primary/10" : "fill-background opacity-0 group-hover:opacity-100"} /><rect x={x - 4} y={18} width="48" height="223" rx="8" fill="none" className="stroke-primary opacity-0 group-focus-visible:opacity-100" strokeWidth="2" />
            {otherHeight > 0 && <rect x={x} y={baseline - completedHeight - otherHeight} width="39" height={otherHeight} rx="4" fill={`url(#${id}-stripe)`} />}{completedHeight > 0 && <rect x={x} y={baseline - completedHeight} width="39" height={completedHeight} rx="4" className="fill-primary" />}
            {row.total > 0 && <text x={x + 19.5} y={baseline - scale(row.total) - 8} textAnchor="middle" className="fill-ink text-[22px] font-medium sm:text-[12px]" aria-hidden="true">{row.total}</text>}<text x={x + 19.5} y="233" textAnchor="middle" className={`${active ? "fill-ink font-semibold" : "fill-muted"} text-[18px] sm:text-[11px]`} aria-hidden="true">{MONTH_LABELS[index]}</text>
          </g>;
        })}
      </svg>
    </div>
    <table className="sr-only"><caption>จำนวนเรื่องแจ้งรายเดือน</caption><thead><tr><th scope="col">เดือน</th><th scope="col">ทั้งหมด</th><th scope="col">เสร็จสิ้น</th><th scope="col">สถานะอื่น</th></tr></thead><tbody>{rows.map(row => <tr key={row.month}><th scope="row">{MONTH_LABELS[row.month]}</th><td>{row.total}</td><td>{row.completed}</td><td>{row.total - row.completed}</td></tr>)}</tbody></table>
  </>;
}

export function StatusDonut({ counts, total, rate }: { counts: Record<TicketStatus, number>; total: number; rate: number }) {
  const radius = 49;
  const circumference = Math.PI * 2 * radius;
  let offset = 0;
  return <svg viewBox="0 0 128 128" className="h-32 w-32 shrink-0" role="img" aria-label={`เสร็จสิ้น ${rate}% จาก ${total} เรื่อง ${Object.entries(counts).map(([status, count]) => `${STATUS_LABELS[status as TicketStatus]} ${count} เรื่อง`).join(" ")}`}>
    <circle cx="64" cy="64" r={radius} fill="none" className="stroke-line/60" strokeWidth="11" />
    {(Object.keys(counts) as TicketStatus[]).map(status => {
      const length = total ? counts[status] / total * circumference : 0;
      const start = offset;
      offset += length;
      return length ? <circle key={status} cx="64" cy="64" r={radius} fill="none" className={STATUS_STROKES[status]} strokeWidth="11" strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-start} transform="rotate(-90 64 64)" /> : null;
    })}
    <text x="64" y="63" textAnchor="middle" className="fill-ink text-[25px] font-semibold">{rate}%</text><text x="64" y="82" textAnchor="middle" className="fill-muted text-[10px]">เสร็จสิ้น</text>
  </svg>;
}
