import type { Ticket, TicketStatus } from "./tickets";

export type UserTicketSort = "newest" | "updated" | "oldest";

export function selectUserTickets(tickets: readonly Ticket[], status: TicketStatus | "all", search: string, sort: UserTicketSort): Ticket[] {
  const query = search.normalize("NFC").trim().toLocaleLowerCase("th");
  const time = (value: string) => Number.isFinite(Date.parse(value)) ? Date.parse(value) : 0;
  return tickets.filter(ticket => (status === "all" || ticket.status === status) &&
    [ticket.number ?? ticket.id, ticket.title, ticket.building, ticket.location, ticket.category].join(" ").normalize("NFC").toLocaleLowerCase("th").includes(query)
  ).sort((a, b) => {
    const delta = sort === "updated" ? time(b.updatedAt) - time(a.updatedAt) : sort === "oldest" ? time(a.createdAt) - time(b.createdAt) : time(b.createdAt) - time(a.createdAt);
    return delta || a.id.localeCompare(b.id);
  });
}
