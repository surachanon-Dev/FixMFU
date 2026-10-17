import Link from "next/link";
import { requireProfile } from "../../lib/auth";

export default async function ForbiddenPage() {
  await requireProfile();
  return <main className="mx-auto my-auto max-w-lg p-6"><section className="rounded-2xl border border-line bg-surface p-7"><h1 className="text-2xl font-semibold">บัญชีนี้ไม่มีสิทธิ์เข้าหน้าผู้ดูแล</h1><p className="my-4 text-sm text-muted">คุณยังแจ้งปัญหาและติดตามเรื่องของตัวเองได้จากหน้าผู้ใช้งาน</p><Link href="/user" className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium">กลับหน้าผู้ใช้งาน</Link></section></main>;
}
