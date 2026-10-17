"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { BedDoubleIcon, Location01Icon, School01Icon, Wifi01Icon } from "@hugeicons/core-free-icons";

const areas = [
  { value: "classroom", label: "ห้องเรียน", icon: School01Icon },
  { value: "dormitory", label: "หอพัก", icon: BedDoubleIcon },
  { value: "internet", label: "อินเทอร์เน็ต", icon: Wifi01Icon },
  { value: "shared", label: "พื้นที่ส่วนกลาง", icon: Location01Icon },
];

export default function UserReportStart() {
  const router = useRouter();
  const [area, setArea] = useState("classroom");
  function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = String(new FormData(event.currentTarget).get("title") ?? "").trim();
    if (!title) return;
    router.push(`/user/report?${new URLSearchParams({ title, area })}`);
  }
  return <form onSubmit={next} className="min-w-0 rounded-3xl bg-surface p-5 text-ink sm:p-7 lg:p-8">
    <h2 className="text-xl font-semibold">แจ้งเรื่องใหม่</h2>
    <p className="mt-2 text-sm leading-relaxed text-muted">เลือกประเภทก่อน แล้วเล่าให้เราฟังสั้น ๆ</p>
    <fieldset className="mt-6 grid grid-cols-2 gap-3">
      <legend className="sr-only">พื้นที่หรือประเภทปัญหา</legend>
      {areas.map(item => <label key={item.value} className={`relative flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border-2 px-3 py-3 text-sm font-medium transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary sm:px-4 ${area === item.value ? "border-primary bg-primary/10" : "border-line hover:border-primary/50"}`}>
        <input type="radio" name="area" value={item.value} checked={area === item.value} onChange={() => setArea(item.value)} className="sr-only" />
        <HugeiconsIcon icon={item.icon} size={23} strokeWidth={1.7} className="shrink-0" aria-hidden="true" />
        <span>{item.label}</span>
      </label>)}
    </fieldset>
    <label htmlFor="quick-report-title" className="mb-2 mt-6 block text-sm font-medium">เกิดอะไรขึ้น?</label>
    <input id="quick-report-title" name="title" required maxLength={200} placeholder="เช่น แอร์ห้อง 301 ไม่เย็น" className="min-h-14 w-full rounded-2xl border-2 border-line bg-surface px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-primary" />
    <button type="submit" className="mt-4 min-h-14 w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">ไปต่อ: เพิ่มรูปและสถานที่</button>
  </form>;
}
