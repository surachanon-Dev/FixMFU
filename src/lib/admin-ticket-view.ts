import { filterTicketsByPeriod } from "./dashboard";
import { STATUS_LABELS, type Ticket } from "./tickets";

export const ADMIN_PAGE_SIZE = 20;
export const ADMIN_SORTS = { newest: "แจ้งล่าสุดก่อน", oldest: "แจ้งเก่าสุดก่อน", priority: "รอรับเรื่องก่อน" } as const;
export type AdminSort = keyof typeof ADMIN_SORTS;
type SearchValues = Pick<URLSearchParams, "get">;

export function readAdminFilters(params: SearchValues) {
  const status = params.get("status") ?? "";
  const year = params.get("year") ?? "";
  const month = params.get("month") ?? "";
  const sort = params.get("sort") ?? "newest";
  return {
    query: (params.get("q") ?? "").trim(),
    status: Object.hasOwn(STATUS_LABELS, status) ? status : "",
    building: params.get("building") ?? "",
    category: params.get("category") ?? "",
    year: /^\d{4}$/.test(year) ? year : "",
    month: /^\d{4}-(0[1-9]|1[0-2])$/.test(month) ? month : "",
    sort: (Object.hasOwn(ADMIN_SORTS, sort) ? sort : "newest") as AdminSort,
  };
}

export function adminTicketView(tickets: Ticket[], params: SearchValues) {
  const filters = readAdminFilters(params);
  const query = filters.query.toLocaleLowerCase("th");
  const priority = { pending: 0, in_progress: 1, completed: 2, cancelled: 3 };
  const filtered = filterTicketsByPeriod(tickets, filters.year, filters.month).filter(ticket =>
    (!filters.status || ticket.status === filters.status)
    && (!filters.building || ticket.building === filters.building)
    && (!filters.category || ticket.category === filters.category)
    && [ticket.number ?? ticket.id, ticket.title, ticket.description, ticket.location, ticket.building, ticket.category, ticket.reporter.name].join(" ").toLocaleLowerCase("th").includes(query),
  ).sort((a, b) => {
    const dateOrder = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    const order = filters.sort === "priority" ? priority[a.status] - priority[b.status] || dateOrder : filters.sort === "oldest" ? dateOrder : -dateOrder;
    return order || a.id.localeCompare(b.id);
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / ADMIN_PAGE_SIZE));
  const rawPage = params.get("page") ?? "1";
  const page = /^\d+$/.test(rawPage) && Number.isSafeInteger(Number(rawPage)) ? Math.min(pageCount, Math.max(1, Number(rawPage))) : 1;
  const start = (page - 1) * ADMIN_PAGE_SIZE;
  return { filters, page, pageCount, total: filtered.length, start: filtered.length ? start + 1 : 0, end: Math.min(start + ADMIN_PAGE_SIZE, filtered.length), items: filtered.slice(start, start + ADMIN_PAGE_SIZE) };
}

export function adminTicketHref(params: URLSearchParams, changes: Record<string, string>, resetPage = true) {
  const next = new URLSearchParams(params);
  if (resetPage) next.delete("page");
  for (const [key, value] of Object.entries(changes)) {
    if (value) next.set(key, value);
    else next.delete(key);
  }
  return `/admin/tickets${next.size ? `?${next}` : ""}`;
}

// Formula prefixes may be hidden behind whitespace; keep text inert in spreadsheet apps.
export function adminSummaryCsv(rows: (string | number)[][]) {
  return "\uFEFF" + rows.map(row => row.map(value => {
    const text = String(value);
    const safe = typeof value === "string" && /^[\s\u0000-\u001f]*[=+\-@]/u.test(text) ? `'${text}` : text;
    return `"${safe.replaceAll('"', '""')}"`;
  }).join(",")).join("\r\n");
}
