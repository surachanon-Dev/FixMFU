"use client";

import { useId, useRef, useState, useTransition } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updateAdminTicket } from "../app/(admin)/admin/tickets/actions";
import type { AdminTicketAction } from "../lib/admin-ticket-validation";
import type { Ticket } from "../lib/tickets";
import { ReportPhotoUpload } from "./report-photo-upload";
import { buttonClass, inputClass } from "./tickets";

type FormAction = Exclude<AdminTicketAction, "receive">;

export function AdminTicketActions({ ticket, requestId }: { ticket: Ticket; requestId: string }) {
  const router = useRouter();
  const requestRef = useRef(requestId);
  const intentRef = useRef<AdminTicketAction | null>(null);
  const sendingRef = useRef(false);
  const [action, setAction] = useState<FormAction>("note");
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const [reading, setReading] = useState(false);
  const [photoKey, setPhotoKey] = useState(0);
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);
  const noteId = useId();
  const busy = pending || refreshing;
  const closed = ticket.status === "completed" || ticket.status === "cancelled";

  function changeAction(next: FormAction) {
    requestRef.current = crypto.randomUUID();
    setAction(next); setNote(""); setConfirmed(false); setMessage(null); setPhotoKey(key => key + 1);
  }

  async function send(intent: AdminTicketAction, data = new FormData()) {
    if (sendingRef.current || busy || reading) return;
    if (intentRef.current !== intent) requestRef.current = crypto.randomUUID();
    intentRef.current = intent;
    sendingRef.current = true;
    setPending(true); setMessage(null);
    data.set("requestId", requestRef.current);
    data.set("ticketId", ticket.id);
    data.set("expectedStatus", ticket.status);
    data.set("action", intent);
    data.set("note", intent === "receive" ? "" : note);
    try {
      const result = await updateAdminTicket(data);
      if (result.success) {
        setMessage({ error: false, text: result.success });
        requestRef.current = crypto.randomUUID();
        setNote(""); setConfirmed(false); setAction("note"); setPhotoKey(key => key + 1);
      } else setMessage({ error: true, text: result.error ?? "บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง" });
      if (result.refresh) startTransition(() => router.refresh());
    } catch {
      setMessage({ error: true, text: "การเชื่อมต่อขัดข้อง กรุณาลองด้วยข้อมูลเดิม หรือตรวจประวัติก่อน" });
    } finally {
      sendingRef.current = false; setPending(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (action === "cancel" && !confirmed) return;
    void send(action, new FormData(event.currentTarget));
  }

  return <section aria-busy={busy} className="rounded-xl border border-line bg-surface p-5 sm:p-6">
    <h2 className="text-lg font-semibold">ดำเนินการเรื่องแจ้ง</h2>
    <p className="mb-5 mt-2 text-sm leading-relaxed text-muted">หมายเหตุและผลการดำเนินงานจะแสดงให้ผู้แจ้งเห็น</p>
    {message && <p role={message.error ? "alert" : "status"} className={`mb-5 rounded-lg p-3 text-sm leading-relaxed ${message.error ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800"}`}>{message.text}</p>}
    {closed ? <p className="rounded-lg bg-background p-4 text-sm text-muted">เรื่องนี้ปิดแล้ว สามารถดูผลและประวัติการดำเนินงานได้</p> : <>
      {ticket.status === "pending" && <div className="mb-6 rounded-xl bg-primary/10 p-4"><p className="mb-3 text-sm leading-relaxed">รับเรื่องเพื่อเริ่มดำเนินการ ก่อนบันทึกผลและปิดงาน</p><button type="button" disabled={busy || reading} onClick={() => void send("receive")} className={`${buttonClass} min-h-11`}>{busy ? "กำลังบันทึก…" : "รับเรื่องและเริ่มดำเนินการ"}</button></div>}
      <div role="group" aria-label="เลือกการดำเนินการ" className="mb-5 flex flex-wrap gap-2">
        {([{ value: "note", label: "หมายเหตุ" }, ...(ticket.status === "in_progress" ? [{ value: "complete", label: "ปิดงาน" }] : []), { value: "cancel", label: "ยกเลิกเรื่อง" }] as { value: FormAction; label: string }[]).map(item => <button key={item.value} type="button" disabled={busy || reading} aria-pressed={action === item.value} onClick={() => changeAction(item.value)} className={`min-h-11 rounded-lg border px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60 ${action === item.value ? "border-primary/40 bg-primary/10 font-medium text-ink" : "border-line text-muted hover:bg-background"}`}>{item.label}</button>)}
      </div>
      <form onSubmit={submit} className="space-y-4">
        <fieldset disabled={busy} className="min-w-0 space-y-4 disabled:opacity-70">
          <label htmlFor={noteId} className="block text-sm font-medium">{action === "cancel" ? "เหตุผลที่ยกเลิก (จำเป็น)" : action === "complete" ? "ผลการแก้ไข" : "หมายเหตุถึงผู้แจ้ง (จำเป็น)"}
            <textarea id={noteId} name="note" value={note} onChange={event => { setNote(event.target.value); requestRef.current = crypto.randomUUID(); }} required={action !== "complete"} maxLength={1500} rows={4} placeholder={action === "cancel" ? "เช่น แจ้งซ้ำกับเรื่องอื่น" : action === "complete" ? "ระบุสิ่งที่แก้ไขและผลการตรวจสอบ" : "เช่น ประสานฝ่ายอาคารแล้ว อยู่ระหว่างรอเข้าตรวจสอบ"} className={`${inputClass} mt-2`} />
          </label>
          {action === "complete" && <><ReportPhotoUpload key={photoKey} onReadingChange={setReading} onSelectionChange={() => { requestRef.current = crypto.randomUUID(); }} label="รูปผลการแก้ไข" /><p className="text-xs leading-relaxed text-muted">ระบุผลการแก้ไขหรือแนบรูปอย่างน้อยหนึ่งอย่างก่อนปิดงาน</p></>}
          {action === "cancel" && <label className="flex items-start gap-3 rounded-lg bg-red-50 p-3 text-sm leading-relaxed text-red-800"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} required className="mt-1 h-4 w-4 shrink-0 accent-red-700" />ยืนยันยกเลิกเรื่องนี้ โดยเก็บเหตุผลไว้ในประวัติ</label>}
        </fieldset>
        <button type="submit" disabled={busy || reading || (action === "cancel" && !confirmed)} className={action === "cancel" ? "min-h-11 rounded-lg bg-red-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:opacity-50" : `${buttonClass} min-h-11`}>{busy ? "กำลังบันทึก…" : reading ? "กำลังตรวจรูป…" : action === "note" ? "บันทึกหมายเหตุ" : action === "complete" ? "ยืนยันปิดงานเป็นเสร็จสิ้น" : "ยืนยันยกเลิกเรื่อง"}</button>
      </form>
    </>}
  </section>;
}
