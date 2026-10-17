import AdminDashboard from "../../../../components/admin-dashboard";
import { getAdminReports } from "../../../../lib/user-reports";

export default async function AdminDashboardPage() {
  const tickets = await getAdminReports();
  return <AdminDashboard tickets={tickets} />;
}
