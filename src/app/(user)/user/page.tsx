import { UserTickets } from "../../../components/user-tickets";
import { getOwnReports } from "../../../lib/user-reports";

export default async function UserHomePage() {
  const tickets = await getOwnReports();
  return <UserTickets tickets={tickets} />;
}
