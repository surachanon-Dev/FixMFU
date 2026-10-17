import AdminReports from "../../../../components/admin-reports";
import { getAdminReports } from "../../../../lib/user-reports";

export default async function AdminReportsPage() {
  const tickets = await getAdminReports();
  return <AdminReports tickets={tickets} />;
}
