import AdminTicketList from "../../../../components/admin-ticket-list";
import { getAdminReports } from "../../../../lib/user-reports";

export default async function AdminTicketsPage() {
  const tickets = await getAdminReports();
  return <AdminTicketList tickets={tickets} />;
}
