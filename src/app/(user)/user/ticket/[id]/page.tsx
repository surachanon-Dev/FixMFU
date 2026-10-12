import { UserTicketDetail } from "../../../../../components/user-tickets";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <UserTicketDetail id={id} />;
}
