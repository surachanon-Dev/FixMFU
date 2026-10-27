"use client";

export default function SettingsError({ reset }: { reset: () => void }) {
  return <section className="m-4 max-w-xl rounded-2xl border border-line bg-surface p-6 sm:m-8">
    <h1 className="text-xl font-semibold">โหลดการตั้งค่าไม่สำเร็จ</h1>
    <p role="alert" className="mt-3 text-sm leading-relaxed text-muted">ยังโหลดรายชื่ออาคารและหมวดหมู่จากฐานข้อมูลไม่ได้ กรุณาตรวจการเชื่อมต่อแล้วลองอีกครั้ง</p>
    <button type="button" onClick={reset} className="mt-5 rounded-xl bg-primary px-4 py-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">ลองโหลดอีกครั้ง</button>
  </section>;
}
