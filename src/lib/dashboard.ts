import { countBy, ticketMonth, type Ticket, type TicketEvent, type TicketStatus } from "./tickets";

export const MONTH_LABELS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
export interface DashboardMonth { month: number; total: number; completed: number }
export interface DashboardActivity { ticketId: string; ticketNumber: string; title: string; event: TicketEvent }

export function filterTicketsByPeriod(tickets: Ticket[], year = "", month = ""): Ticket[] {
  return tickets.filter(ticket => {
    const key = ticketMonth(ticket);
    return (!year || key.startsWith(`${year}-`)) && (!month || key === month);
  });
}

export function dashboardTicketHref(year: number, month: number | null, status?: TicketStatus, building?: string): string {
  const params = new URLSearchParams({ year: String(year) });
  if (month !== null) params.set("month", `${year}-${String(month + 1).padStart(2, "0")}`);
  if (status) params.set("status", status);
  if (building) params.set("building", building);
  return `/admin/tickets?${params}`;
}

export function summarizeDashboard(tickets: Ticket[], year: number, month: number | null) {
  const annual = filterTicketsByPeriod(tickets, String(year));
  const monthly: DashboardMonth[] = MONTH_LABELS.map((_, index) => {
    const group = filterTicketsByPeriod(annual, "", `${year}-${String(index + 1).padStart(2, "0")}`);
    return { month: index, total: group.length, completed: group.filter(ticket => ticket.status === "completed").length };
  });
  const selected = month === null ? annual : filterTicketsByPeriod(annual, "", `${year}-${String(month + 1).padStart(2, "0")}`);
  const counts: Record<TicketStatus, number> = { pending: 0, in_progress: 0, completed: 0, cancelled: 0 };
  for (const ticket of selected) counts[ticket.status]++;
  const activities: DashboardActivity[] = selected.flatMap(ticket => ticket.history
    .filter(event => event.actor === "ผู้ดูแลระบบ")
    .map(event => ({ ticketId: ticket.id, ticketNumber: ticket.number ?? ticket.id, title: ticket.title, event })))
    .sort((a, b) => new Date(b.event.at).getTime() - new Date(a.event.at).getTime()).slice(0, 3);
  const queue = selected.filter(ticket => ticket.status === "pending" || ticket.status === "in_progress")
    .sort((a, b) => Number(a.status !== "pending") - Number(b.status !== "pending") || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return {
    selected, monthly, counts, activities, queue,
    buildings: countBy(selected, "building"), total: selected.length, annualTotal: annual.length,
    completionRate: selected.length ? Math.round(counts.completed / selected.length * 100) : 0,
    latest: [...selected].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
  };
}
