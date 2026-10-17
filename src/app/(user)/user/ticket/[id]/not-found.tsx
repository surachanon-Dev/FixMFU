import Link from "next/link";

export default function MissingOwnReport() {
  return <section className="mx-auto my-10 max-w-xl rounded-2xl border border-line bg-surface p-6">
    <h1 className="text-xl font-semibold">ไม่พบเรื่องแจ้งซ่อมของคุณ</h1>
    <p className="mt-3 text-sm text-muted">กรุณาตรวจหมายเลขเรื่อง หรือกลับไปเลือกจากรายการของคุณ</p>
    <Link href="/user" className="mt-5 inline-block rounded-lg bg-primary px-4 py-2.5 text-sm font-medium">กลับไปเรื่องของฉัน</Link>
  </section>;
}
