import type { Metadata } from "next";
import Link from "next/link";
import PortalNavigation from "../../../components/portal-navigation";
import UserNotificationToggle from "../../../components/user-notification-toggle";
import { requireProfile } from "../../../lib/auth";
import { AuthSessionControls } from "../../../components/auth-session-controls";

export const metadata: Metadata = {
  title: "FixMFU - แจ้งซ่อมและติดตามสถานะ",
};

export default async function UserLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const profile = await requireProfile();
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line bg-surface text-ink">
        <div className="mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,1fr)] items-center gap-x-6 gap-y-3 px-4 py-4 sm:px-6 lg:flex lg:flex-wrap lg:px-8">
          <Link href="/user" aria-label="FixMFU หน้าผู้ใช้งาน" className="order-1 shrink-0 text-xl font-semibold tracking-tight">Fix<span className="text-primary">MFU</span></Link>
          <div className="order-4 col-span-2 w-full lg:order-2 lg:w-auto"><PortalNavigation portal="user" /></div>
          <div className="order-2 justify-self-end lg:order-3 lg:ml-auto"><UserNotificationToggle compact /></div>
          <div className="order-3 col-span-2 flex justify-end lg:order-4"><AuthSessionControls profile={profile} userPortal /></div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 pb-8">{children}</main>
    </>
  );
}
