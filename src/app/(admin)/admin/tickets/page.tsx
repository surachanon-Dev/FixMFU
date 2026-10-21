import AdminTicketList from "../../../../components/admin-ticket-list";
import { getAdminTicketSummaries } from "../../../../lib/user-reports";

export default async function AdminTicketsPage() {
  const tickets = await getAdminTicketSummaries();
  return <AdminTicketList tickets={tickets} />;
}
