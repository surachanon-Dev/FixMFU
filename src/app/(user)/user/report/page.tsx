import Link from "next/link";
import { randomUUID } from "node:crypto";
import { ReportForm } from "../../../../components/report-form";
import { requireProfile } from "../../../../lib/auth";
import { createClient } from "../../../../lib/supabase/server";

export default async function ReportIssuePage({ searchParams }: { searchParams: Promise<{ title?: string | string[]; area?: string | string[] }> }) {
  await requireProfile();
  const params = await searchParams;
  const initialTitle = typeof params.title === "string" ? params.title.trim().slice(0, 200) : "";
  const area = typeof params.area === "string" ? params.area : "";
  const locationPlaceholders: Record<string, string> = { classroom: "เช่น ห้อง E4-301 ชั้น 3", dormitory: "เช่น หอพัก F1 ห้อง 201", shared: "เช่น ทางเดินชั้น 2 หน้าอาคาร E4" };
  const supabase = await createClient();
  const [buildings, categories] = await Promise.all([
    supabase.from("buildings").select("id, name").eq("is_active", true).order("name"),
    supabase.from("categories").select("id, name").eq("is_active", true).order("name"),
  ]);
  const unavailable = buildings.error || categories.error || !buildings.data?.length || !categories.data?.length;
  return <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
    <Link href="/user" className="mb-4 inline-flex min-h-11 items-center rounded-lg text-sm text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">← กลับไปเรื่องของฉัน</Link>
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-xs sm:p-7">
      <h1 className="text-2xl font-semibold text-ink">แจ้งปัญหาอาคารสถานที่</h1>
      <p className="mb-6 mt-2 text-sm leading-relaxed text-muted">ระบุจุดที่พบปัญหาให้ชัดเจน เพื่อให้ผู้ดูแลเข้าตรวจสอบได้สะดวก</p>
      {unavailable ? <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">ยังโหลดอาคารหรือหมวดหมู่ไม่ได้ กรุณาโหลดหน้าใหม่ หรือติดต่อผู้ดูแล</p> : <ReportForm key={`${initialTitle}:${area}`} submissionId={randomUUID()} buildings={buildings.data!.map(row => ({ value: row.id, label: row.name }))} categories={categories.data!.map(row => ({ value: row.id, label: row.name }))} initialTitle={initialTitle} initialCategory={area === "internet" ? categories.data!.find(row => row.name === "อินเทอร์เน็ต")?.id : undefined} locationPlaceholder={Object.hasOwn(locationPlaceholders, area) ? locationPlaceholders[area] : undefined} />}
    </section>
  </div>;
}
