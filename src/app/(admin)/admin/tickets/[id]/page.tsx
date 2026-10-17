import AdminTicketDetail from "../../../../../components/admin-ticket-detail";
import { notFound } from "next/navigation";
import { getAdminReports } from "../../../../../lib/user-reports";

export default async function AdminTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [ticket] = await getAdminReports(id);
  if (!ticket) notFound();
  return <AdminTicketDetail ticket={ticket} />;
}
