"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { submitReport } from "../app/(user)/user/report/actions";
import { ReportBuildingSelect } from "./report-building-select";
import { ReportCategorySelect } from "./report-category-select";
import { ReportPhotoUpload } from "./report-photo-upload";
import type { GlideSelectOption } from "./glide-select";
import { inputClass } from "./tickets";

export function ReportForm({ submissionId, buildings, categories }: { submissionId: string; buildings: GlideSelectOption[]; categories: GlideSelectOption[] }) {
  const router = useRouter();
  const sendingRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sendingRef.current || reading) return;
    const data = new FormData(event.currentTarget);
    sendingRef.current = true;
    setPending(true);
    setError("");
    try {
      const result = await submitReport(data);
      if (result.ticketId) {
        router.push(`/user/ticket/${result.ticketId}?sent=1`);
        router.refresh();
        return;
      }
      setError(result.error ?? "ส่งเรื่องไม่สำเร็จ กรุณาลองอีกครั้ง");
    } catch {
      setError("การเชื่อมต่อขัดข้อง กรุณาลองส่งอีกครั้งด้วยข้อมูลเดิม หรือตรวจเรื่องของฉันก่อน");
    }
    sendingRef.current = false;
    setPending(false);
  }
  return <form onSubmit={send} aria-busy={pending} className="space-y-5">
    <input type="hidden" name="submissionId" value={submissionId} />
    <fieldset disabled={pending} className="min-w-0 space-y-5 disabled:opacity-70">
      <div><label htmlFor="report-title" className="mb-1.5 block text-sm font-medium">หัวข้อปัญหา</label><input id="report-title" name="title" required maxLength={200} placeholder="เช่น แอร์ห้อง E4-301 ไม่เย็น" className={inputClass} /></div>
      <div><label htmlFor="report-building" className="mb-1.5 block text-sm font-medium">เลือกอาคาร</label><ReportBuildingSelect options={buildings} /></div>
      <div><label htmlFor="report-location" className="mb-1.5 block text-sm font-medium">ห้องหรือจุดที่พบปัญหา</label><input id="report-location" name="location" required maxLength={300} placeholder="เช่น ห้อง E4-301 ชั้น 3" className={inputClass} /></div>
      <div><label htmlFor="report-category" className="mb-1.5 block text-sm font-medium">หมวดหมู่ปัญหา</label><ReportCategorySelect options={categories} /></div>
      <div><label htmlFor="report-details" className="mb-1.5 block text-sm font-medium">รายละเอียด</label><textarea id="report-details" name="details" required maxLength={5000} rows={4} placeholder="อธิบายปัญหาที่พบและช่วงเวลาที่เกิด" className={inputClass} /></div>
      <ReportPhotoUpload onReadingChange={setReading} />
    </fieldset>
    {error && <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm leading-relaxed text-red-800">{error}<Link href="/user" className="mt-2 block font-medium underline">ตรวจเรื่องของฉัน</Link></div>}
    <button type="submit" disabled={pending || reading} className="min-h-12 w-full rounded-xl bg-primary px-4 py-3 font-medium text-ink transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60">{pending ? "กำลังส่งเรื่องและรูปภาพ…" : reading ? "กำลังตรวจรูปภาพ…" : "ส่งเรื่องแจ้งซ่อม"}</button>
  </form>;
}
