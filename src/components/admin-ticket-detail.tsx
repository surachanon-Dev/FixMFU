"use client";

import Link from "next/link";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useTickets, updateTicket } from "../lib/ticket-store";
import { type Ticket, type TicketAttachment } from "../lib/tickets";
import { AttachmentGallery, DemoNotice, LoadingTickets, TicketHistory, TicketInformation, buttonClass, inputClass } from "./tickets";

type Action = "note" | "complete" | "cancel";

function TicketActions({ ticket }: { ticket: Ticket }) {
  const [action, setAction] = useState<Action>("note");
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<TicketAttachment[]>([]);
  const [reading, setReading] = useState(false);
  const [fileKey, setFileKey] = useState(0);
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);
  const closed = ticket.status === "completed" || ticket.status === "cancelled";

  function receive() {
    try {
      updateTicket(ticket.id, { type: "status", status: "in_progress", note: "" });
      setMessage({ error: false, text: "รับเรื่องแล้ว สถานะเปลี่ยนเป็นกำลังดำเนินการ" });
    } catch (error) { setMessage({ error: true, text: error instanceof Error ? error.message : "บันทึกไม่สำเร็จ" }); }
  }

  async function selectPhotos(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);
    setMessage(null);
    if (files.length > 3 || files.some(file => !["image/jpeg", "image/png", "image/webp"].includes(file.type)) || files.reduce((total, file) => total + file.size, 0) > 2 * 1024 * 1024) {
      setMessage({ error: true, text: "เลือกได้สูงสุด 3 รูป เป็น JPG, PNG หรือ WebP ขนาดรวมไม่เกิน 2 MB" });
      input.value = "";
      setPhotos([]);
      return;
    }
    setReading(true);
    try {
      const attachments = await Promise.all(files.map(file => new Promise<TicketAttachment>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ name: file.name, dataUrl: String(reader.result) });
        reader.onerror = () => reject(new Error("อ่านรูปไม่สำเร็จ กรุณาเลือกไฟล์อีกครั้ง"));
        reader.readAsDataURL(file);
      })));
      setPhotos(attachments);
    } catch (error) {
      setPhotos([]); input.value = "";
      setMessage({ error: true, text: error instanceof Error ? error.message : "อ่านรูปไม่สำเร็จ" });
    } finally { setReading(false); }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (action === "note") updateTicket(ticket.id, { type: "note", note });
      else updateTicket(ticket.id, { type: "status", status: action === "complete" ? "completed" : "cancelled", note, ...(action === "complete" ? { photos } : {}) });
      setNote(""); setPhotos([]); setFileKey(value => value + 1);
      setMessage({ error: false, text: action === "note" ? "บันทึกหมายเหตุแล้ว ผู้แจ้งเห็นข้อความนี้ในหน้าติดตาม" : action === "complete" ? "บันทึกผลการแก้ไขและปิดงานแล้ว" : "ยกเลิกเรื่องพร้อมบันทึกเหตุผลแล้ว" });
      setAction("note");
    } catch (error) { setMessage({ error: true, text: error instanceof Error ? error.message : "บันทึกไม่สำเร็จ" }); }
  }

  return <section className="rounded-xl border border-line bg-surface p-6">
    <h2 className="mb-2 text-lg font-semibold">ดำเนินการเรื่องแจ้ง</h2>
    <p className="mb-5 text-sm text-muted">หมายเหตุ ผลการแก้ไข และเหตุผลยกเลิกจะแสดงให้ผู้แจ้งเห็น</p>
    {message && <p role={message.error ? "alert" : "status"} className={`mb-4 rounded-lg p-3 text-sm ${message.error ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800"}`}>{message.text}</p>}
    {closed ? <p className="rounded-lg bg-background p-4 text-sm text-muted">เรื่องนี้ปิดแล้ว สามารถดูผลและประวัติการดำเนินงานได้ด้านล่าง</p> : <>
      {ticket.status === "pending" && <div className="mb-6 rounded-lg border border-line bg-primary/10 p-4"><p className="mb-3 text-sm text-ink">รับเรื่องเพื่อเปลี่ยนสถานะเป็นกำลังดำเนินการ ก่อนบันทึกผลและปิดงาน</p><button type="button" onClick={receive} className={buttonClass}>รับเรื่อง</button></div>}
      <div className="mb-5 flex flex-wrap gap-2">{([{ value: "note", label: "ใส่หมายเหตุ" }, ...(ticket.status === "in_progress" ? [{ value: "complete", label: "บันทึกผลและปิดงาน" }] : []), { value: "cancel", label: "ยกเลิกเรื่อง" }] as { value: Action; label: string }[]).map(item => <button key={item.value} type="button" aria-pressed={action === item.value} disabled={reading} onClick={() => { setAction(item.value); setNote(""); setPhotos([]); setMessage(null); setFileKey(value => value + 1); }} className={`rounded-lg border px-3 py-2 text-sm font-medium ${action === item.value ? "border-line bg-primary/10 text-ink" : "border-line text-muted hover:bg-background"}`}>{item.label}</button>)}</div>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-medium">{action === "cancel" ? "เหตุผลที่ยกเลิก (จำเป็น)" : action === "complete" ? "ผลการแก้ไข" : "หมายเหตุถึงผู้แจ้ง (จำเป็น)"}
          <textarea value={note} onChange={event => setNote(event.target.value)} maxLength={1500} required={action !== "complete"} rows={4} placeholder={action === "cancel" ? "เช่น แจ้งซ้ำกับเรื่อง REQ-002" : action === "complete" ? "ระบุสิ่งที่แก้ไขและผลการตรวจสอบ" : "เช่น ประสานฝ่ายอาคารแล้ว อยู่ระหว่างรอเข้าตรวจสอบ"} className={`${inputClass} mt-2`} />
        </label>
        {action === "complete" && <div><label className="block text-sm font-medium">รูปผลการแก้ไข<input key={fileKey} type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={reading} onChange={selectPhotos} className="mt-2 block w-full rounded-lg border border-line p-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-ink" /></label><p className="mb-3 mt-2 text-xs text-muted">แนบได้สูงสุด 3 รูป ขนาดรวมไม่เกิน 2 MB · ระบุผลการแก้ไขหรือแนบรูปอย่างน้อยหนึ่งอย่างก่อนปิดงาน</p><AttachmentGallery photos={photos} emptyText="ยังไม่ได้เลือกรูปผลการแก้ไข" /></div>}
        {action === "cancel" && <p className="text-sm text-red-700">เมื่อยืนยัน เรื่องจะถูกยกเลิกและเก็บเหตุผลไว้ในประวัติ</p>}
        <button type="submit" disabled={reading} className={action === "cancel" ? "rounded-lg bg-red-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50" : buttonClass}>{reading ? "กำลังอ่านรูป…" : action === "note" ? "บันทึกหมายเหตุ" : action === "complete" ? "ยืนยันปิดงาน" : "ยืนยันยกเลิกเรื่อง"}</button>
      </form>
    </>}
  </section>;
}

export default function AdminTicketDetail({ id }: { id: string }) {
  const tickets = useTickets();
  if (!tickets) return <LoadingTickets />;
  const ticket = tickets.find(ticket => ticket.id === id);
  return <div className="p-4 sm:p-6 lg:p-8">
    <Link href="/admin/tickets" className="mb-5 inline-block text-sm font-medium text-ink hover:underline">← กลับไปจัดการเรื่องแจ้ง</Link>
    <h1 className="mb-6 text-3xl font-semibold">รายละเอียดเรื่องแจ้ง</h1><DemoNotice />
    {!ticket ? <p role="alert" className="rounded-xl border border-line bg-surface p-8 text-muted">ไม่พบเรื่องแจ้งรหัสนี้ กรุณากลับไปเลือกรายการอีกครั้ง</p> : <div className="grid items-start gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2"><TicketInformation ticket={ticket} showReporter /><TicketHistory ticket={ticket} /></div>
      <TicketActions key={ticket.id} ticket={ticket} />
    </div>}
  </div>;
}
