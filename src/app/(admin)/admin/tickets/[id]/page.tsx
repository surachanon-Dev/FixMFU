import AdminTicketDetail from "../../../../../components/admin-ticket-detail";

export default async function AdminTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminTicketDetail id={id} />;
}
