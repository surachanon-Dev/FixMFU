"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ChangeEvent, FormEvent } from "react";
import { submitReport } from "../app/(user)/user/report/actions";
import { leavesReportPage, reportFormErrors, REPORT_TEXT_LIMITS } from "../lib/report-form-state";
import type { ReportFormErrors, ReportFormField, ReportTextField } from "../lib/report-form-state";
import { ReportBuildingSelect } from "./report-building-select";
import { ReportCategorySelect } from "./report-category-select";
import { ReportPhotoUpload } from "./report-photo-upload";
import type { GlideSelectOption } from "./glide-select";
import { inputClass } from "./tickets";

export function ReportForm({ submissionId, buildings, categories, initialTitle = "", initialCategory, locationPlaceholder = "เช่น ห้อง E4-301 ชั้น 3" }: { submissionId: string; buildings: GlideSelectOption[]; categories: GlideSelectOption[]; initialTitle?: string; initialCategory?: string; locationPlaceholder?: string }) {
  const router = useRouter();
  const sendingRef = useRef(false);
  const allowLeaveRef = useRef(false);
  const serverErrorRef = useRef<HTMLDivElement>(null);
  const initialCategoryValue = categories.find(option => option.value === initialCategory)?.value ?? "";
  const [values, setValues] = useState({ title: initialTitle, location: "", details: "", building: "", category: initialCategoryValue });
  const [touched, setTouched] = useState<Partial<Record<ReportFormField, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [reading, setReading] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);
  const [error, setError] = useState("");
  const validation = reportFormErrors(values, buildings.map(option => option.value), categories.map(option => option.value));
  const errors: ReportFormErrors = Object.fromEntries(Object.entries(validation).filter(([field]) => submitted || touched[field as ReportFormField]));
  const dirty = Boolean(values.title || values.location || values.details || values.building || values.category !== initialCategoryValue || photoCount);

  useEffect(() => {
    if (!dirty) return;
    const onUnload = (event: BeforeUnloadEvent) => {
      if (allowLeaveRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const onLink = (event: MouseEvent) => {
      if (allowLeaveRef.current || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self") || !leavesReportPage(link.href, window.location.href)) return;
      if (!window.confirm("เรื่องนี้ยังไม่ได้ส่ง หากออกจากหน้านี้ ข้อความและรูปที่เลือกจะหาย ต้องการออกจากหน้านี้หรือไม่?")) {
        event.preventDefault();
        event.stopImmediatePropagation();
      } else if (new URL(link.href).origin !== window.location.origin) {
        allowLeaveRef.current = true;
      }
    };
    window.addEventListener("beforeunload", onUnload);
    document.addEventListener("click", onLink, true);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      document.removeEventListener("click", onLink, true);
    };
  }, [dirty]);

  function setField(field: ReportFormField, value: string) {
    setValues(previous => ({ ...previous, [field]: value }));
  }

  function focusField(field: ReportFormField) {
    document.getElementById(`report-${field}`)?.focus();
  }

  function textProps(field: ReportTextField) {
    return {
      id: `report-${field}`,
      name: field,
      required: true,
      maxLength: REPORT_TEXT_LIMITS[field],
      value: values[field],
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setField(field, event.target.value),
      onBlur: () => setTouched(previous => ({ ...previous, [field]: true })),
      "aria-invalid": Boolean(errors[field]),
      "aria-describedby": `report-${field}-hint${errors[field] ? ` report-${field}-error` : ""}`,
      className: `${inputClass}${errors[field] ? " border-red-500 focus-visible:outline-red-500" : ""}`,
    };
  }

  function fieldHint(field: ReportTextField, hint: string) {
    return <>
      <div id={`report-${field}-hint`} className="mt-1.5 flex items-start justify-between gap-3 text-xs leading-relaxed text-muted">
        <span>{hint}</span><span className="shrink-0 tabular-nums">{values[field].length.toLocaleString("th-TH")}/{REPORT_TEXT_LIMITS[field].toLocaleString("th-TH")}</span>
      </div>
      {errors[field] && <p id={`report-${field}-error`} className="mt-1 text-xs text-red-800">{errors[field]}</p>}
    </>;
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sendingRef.current || reading) return;
    setSubmitted(true);
    const firstInvalid = Object.keys(validation)[0] as ReportFormField | undefined;
    if (firstInvalid) {
      focusField(firstInvalid);
      return;
    }
    const data = new FormData(event.currentTarget);
    sendingRef.current = true;
    setPending(true);
    setError("");
    try {
      const result = await submitReport(data);
      if (result.ticketId) {
        allowLeaveRef.current = true;
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
    requestAnimationFrame(() => serverErrorRef.current?.focus());
  }

  return <form onSubmit={send} noValidate aria-busy={pending} className="space-y-6">
    <input type="hidden" name="submissionId" value={submissionId} />
    <p className="rounded-xl bg-background px-4 py-3 text-xs leading-relaxed text-muted">กรอกข้อมูลให้ครบทุกช่อง · รูปภาพไม่บังคับแนบ</p>
    {submitted && Object.keys(errors).length > 0 && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <p className="font-medium">ตรวจข้อมูลอีกนิดก่อนส่ง</p>
      <ul className="mt-2 list-inside list-disc space-y-1">{Object.entries(errors).map(([field, message]) => <li key={field}><button type="button" onClick={() => focusField(field as ReportFormField)} className="text-left underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2">{message}</button></li>)}</ul>
    </div>}
    <fieldset disabled={pending} className="min-w-0 space-y-5 disabled:opacity-70">
      <legend className="mb-4 flex items-center gap-2 text-base font-semibold"><span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-sm">1</span>ปัญหาและสถานที่</legend>
      <div><label htmlFor="report-title" className="mb-1.5 block text-sm font-medium">หัวข้อปัญหา</label><input {...textProps("title")} placeholder="เช่น แอร์ห้อง E4-301 ไม่เย็น" />{fieldHint("title", "สรุปสิ่งที่ต้องการให้ผู้ดูแลช่วยแก้ไข")}</div>
      <div><label htmlFor="report-building" className="mb-1.5 block text-sm font-medium">อาคารที่พบปัญหา</label><ReportBuildingSelect options={buildings} value={values.building} onChange={value => setField("building", value)} invalid={Boolean(errors.building)} describedBy={errors.building ? "report-building-error" : undefined} />{errors.building && <p id="report-building-error" className="mt-1.5 text-xs text-red-800">{errors.building}</p>}</div>
      <div><label htmlFor="report-location" className="mb-1.5 block text-sm font-medium">ห้องหรือจุดที่พบปัญหา</label><input {...textProps("location")} placeholder={locationPlaceholder} />{fieldHint("location", "ระบุชั้น ห้อง หรือจุดสังเกตที่หาเจอได้ง่าย")}</div>
      <div><label htmlFor="report-category" className="mb-1.5 block text-sm font-medium">หมวดหมู่ปัญหา</label><ReportCategorySelect options={categories} value={values.category} onChange={value => setField("category", value)} invalid={Boolean(errors.category)} describedBy={errors.category ? "report-category-error" : undefined} />{errors.category && <p id="report-category-error" className="mt-1.5 text-xs text-red-800">{errors.category}</p>}</div>
      <div><label htmlFor="report-details" className="mb-1.5 block text-sm font-medium">รายละเอียด</label><textarea {...textProps("details")} rows={5} placeholder="อธิบายอาการ ช่วงเวลาที่พบ และข้อมูลที่ช่วยให้ผู้ดูแลตรวจสอบได้" />{fieldHint("details", "เช่น เปิดแอร์ตั้งแต่ 10:00 น. แต่มีแต่ลม ไม่มีความเย็น")}</div>
    </fieldset>
    <fieldset disabled={pending} className="min-w-0 disabled:opacity-70">
      <legend className="mb-4 flex items-center gap-2 text-base font-semibold"><span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-sm">2</span>รูปภาพเพิ่มเติม</legend>
      <ReportPhotoUpload onReadingChange={setReading} onCountChange={setPhotoCount} />
    </fieldset>
    {error && <div ref={serverErrorRef} tabIndex={-1} role="alert" className="rounded-xl bg-red-50 p-4 text-sm leading-relaxed text-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500">{error}<Link href="/user" className="mt-2 block font-medium underline">ตรวจเรื่องของฉัน</Link></div>}
    <div className="border-t border-line pt-5">
      <p className="mb-3 text-xs leading-relaxed text-muted">ตรวจสถานที่และรายละเอียดก่อนส่ง เมื่อส่งสำเร็จจะได้รับหมายเลขเรื่องสำหรับติดตามสถานะ</p>
      <button type="submit" disabled={pending || reading} className="min-h-12 w-full rounded-xl bg-primary px-4 py-3 font-medium text-ink transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60">{pending ? "กำลังส่งเรื่อง… กรุณารอสักครู่" : reading ? "กำลังตรวจรูปภาพ…" : "ส่งเรื่องแจ้งซ่อม"}</button>
      <p role="status" className="mt-3 text-center text-xs leading-relaxed text-muted">{pending ? "กำลังบันทึกข้อมูล โปรดเปิดหน้านี้ไว้จนกว่าจะเห็นหมายเลขเรื่อง" : "ข้อมูลที่ยังไม่ส่งเก็บเฉพาะหน้านี้ หากออกหรือรีเฟรชจะต้องกรอกใหม่"}</p>
    </div>
  </form>;
}
