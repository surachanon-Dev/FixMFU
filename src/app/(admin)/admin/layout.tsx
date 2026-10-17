import type { Metadata } from "next";
import AdminShell from "../../../components/admin-shell";
import { requireProfile } from "../../../lib/auth";
import { AuthSessionControls } from "../../../components/auth-session-controls";

export const metadata: Metadata = {
  title: "FixMFU - ระบบผู้ดูแล",
};

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const profile = await requireProfile(true);
  return <AdminShell sessionControls={<AuthSessionControls profile={profile} adminPortal />}>{children}</AdminShell>;
}
