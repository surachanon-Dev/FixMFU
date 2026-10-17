"use client";

import Link from "next/link";

export default function UserDataError({ reset }: { reset: () => void }) {
  return <section className="mx-auto my-10 max-w-xl rounded-2xl border border-line bg-surface p-6">
    <h1 className="text-xl font-semibold">โหลดข้อมูลไม่สำเร็จ</h1>
    <p role="alert" className="mt-3 text-sm leading-relaxed text-muted">กรุณาลองอีกครั้ง หากเพิ่งส่งเรื่องแล้วไม่เห็นรายละเอียด ให้ตรวจเรื่องของฉันก่อนส่งใหม่</p>
    <div className="mt-5 flex flex-wrap gap-3"><button onClick={reset} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium">ลองโหลดอีกครั้ง</button><Link href="/user" className="rounded-lg border border-line px-4 py-2.5 text-sm">เรื่องของฉัน</Link></div>
  </section>;
}
