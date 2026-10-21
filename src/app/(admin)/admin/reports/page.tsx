import AdminReports from "../../../../components/admin-reports";
import { getAdminTicketSummaries } from "../../../../lib/user-reports";

export default async function AdminReportsPage() {
  const tickets = await getAdminTicketSummaries();
  return <AdminReports tickets={tickets} />;
}
