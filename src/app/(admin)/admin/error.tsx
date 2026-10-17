"use client";

export default function AdminDataError({ reset }: { reset: () => void }) {
  return <section className="m-4 max-w-xl rounded-2xl border border-line bg-surface p-6 sm:m-8">
    <h1 className="text-xl font-semibold">โหลดเรื่องแจ้งไม่สำเร็จ</h1>
    <p role="alert" className="mt-3 text-sm leading-relaxed text-muted">ยังโหลดข้อมูลล่าสุดไม่ได้ กรุณาตรวจการเชื่อมต่อแล้วลองอีกครั้ง</p>
    <button onClick={reset} className="mt-5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">ลองโหลดอีกครั้ง</button>
  </section>;
}
