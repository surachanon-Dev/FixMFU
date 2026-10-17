import Link from "next/link";
import { randomUUID } from "node:crypto";
import { ReportForm } from "../../../../components/report-form";
import { requireProfile } from "../../../../lib/auth";
import { createClient } from "../../../../lib/supabase/server";

export default async function ReportIssuePage() {
  await requireProfile();
  const supabase = await createClient();
  const [buildings, categories] = await Promise.all([
    supabase.from("buildings").select("id, name").eq("is_active", true).order("name"),
    supabase.from("categories").select("id, name").eq("is_active", true).order("name"),
  ]);
  const unavailable = buildings.error || categories.error || !buildings.data?.length || !categories.data?.length;
  return <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
    <Link href="/user" className="mb-5 inline-block text-sm text-muted hover:text-ink">← กลับไปเรื่องของฉัน</Link>
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-xs sm:p-7">
      <h1 className="text-2xl font-semibold text-ink">แจ้งปัญหาอาคารสถานที่</h1>
      <p className="mb-6 mt-2 text-sm leading-relaxed text-muted">ระบุจุดที่พบปัญหาให้ชัดเจน เพื่อให้ผู้ดูแลเข้าตรวจสอบได้สะดวก</p>
      {unavailable ? <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">ยังโหลดอาคารหรือหมวดหมู่ไม่ได้ กรุณาโหลดหน้าใหม่ หรือติดต่อผู้ดูแล</p> : <ReportForm submissionId={randomUUID()} buildings={buildings.data!.map(row => ({ value: row.id, label: row.name }))} categories={categories.data!.map(row => ({ value: row.id, label: row.name }))} />}
    </section>
  </div>;
}
