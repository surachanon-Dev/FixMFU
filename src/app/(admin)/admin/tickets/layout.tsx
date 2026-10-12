import { Suspense } from "react";
import { LoadingTickets } from "../../../../components/tickets";

export default function TicketsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <Suspense fallback={<LoadingTickets />}>{children}</Suspense>;
}
