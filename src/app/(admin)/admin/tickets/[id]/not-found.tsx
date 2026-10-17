import Link from "next/link";

export default function MissingAdminReport() {
  return <section className="m-4 max-w-xl rounded-2xl border border-line bg-surface p-6 sm:m-8">
    <h1 className="text-xl font-semibold">ไม่พบเรื่องแจ้งซ่อม</h1>
    <p className="mt-3 text-sm text-muted">กรุณาตรวจหมายเลขเรื่อง หรือกลับไปเลือกจากรายการล่าสุด</p>
    <Link href="/admin/tickets" className="mt-5 inline-block rounded-lg bg-primary px-4 py-2.5 text-sm font-medium">กลับไปจัดการเรื่องแจ้ง</Link>
  </section>;
}
