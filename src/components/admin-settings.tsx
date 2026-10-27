"use client";

import { useId, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Building03Icon, TagsIcon } from "@hugeicons/core-free-icons";
import { saveMasterData, type SettingsResult } from "../app/(admin)/admin/settings/actions";
import type { MasterRow, MasterTable } from "../lib/master-data";
import { RefreshReports } from "./refresh-reports";

const outline = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const input = "min-h-12 min-w-0 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-60";
const button = `min-h-11 rounded-xl border border-line px-3 py-2 text-sm font-medium hover:bg-background disabled:opacity-50 ${outline}`;

function MasterPanel({ table, rows, requestId: initialRequestId }: { table: MasterTable; rows: MasterRow[]; requestId: string }) {
  const router = useRouter();
  const id = useId();
  const building = table === "buildings";
  const label = building ? "อาคาร" : "หมวดหมู่";
  const [name, setName] = useState("");
  const [requestId, setRequestId] = useState(initialRequestId);
  const [editing, setEditing] = useState<MasterRow | null>(null);
  const [editName, setEditName] = useState("");
  const [message, setMessage] = useState<SettingsResult | null>(null);
  const [pending, setPending] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const sending = useRef(false);
  const busy = pending || refreshing;
  const activeCount = rows.filter(row => row.is_active).length;

  async function run(form: FormData, onSuccess?: () => void) {
    if (sending.current || busy) return;
    sending.current = true;
    setPending(true);
    setMessage(null);
    form.set("table", table);
    try {
      const result = await saveMasterData(form);
      setMessage(result);
      if (result.success) onSuccess?.();
      if (result.error && result.refresh) setEditing(null);
      if (result.refresh) startTransition(() => router.refresh());
    } catch { setMessage({ error: "การเชื่อมต่อขัดข้อง ข้อมูลที่กรอกยังอยู่ กรุณาตรวจรายการก่อนลองซ้ำ" }); }
    finally { sending.current = false; setPending(false); }
  }

  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData();
    form.set("intent", "create"); form.set("name", name); form.set("requestId", requestId);
    void run(form, () => { setName(""); setRequestId(crypto.randomUUID()); });
  }

  function update(row: MasterRow, intent: "rename" | "set_active") {
    const form = new FormData();
    form.set("intent", intent); form.set("id", row.id); form.set("updatedAt", row.updated_at);
    if (intent === "rename") form.set("name", editName);
    else form.set("active", String(!row.is_active));
    void run(form, () => setEditing(null));
  }

  return <section aria-labelledby={`${id}-title`} aria-busy={busy} className="min-w-0 rounded-2xl border border-line bg-surface p-5 sm:p-6">
    <div className="flex items-start gap-3"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15"><HugeiconsIcon icon={building ? Building03Icon : TagsIcon} size={24} aria-hidden="true" /></span><div><h2 id={`${id}-title`} className="text-xl font-semibold">{building ? "จัดการอาคาร" : "หมวดหมู่ปัญหา"}</h2><p className="mt-1 text-xs text-muted">เปิดใช้งาน {activeCount} จาก {rows.length} รายการ</p></div></div>
    <form onSubmit={create} className="mt-6 rounded-xl bg-background/65 p-4">
      <label htmlFor={`${id}-new`} className="mb-2 block text-sm font-medium">เพิ่ม{label}ใหม่</label>
      <div className="flex flex-wrap gap-2"><input id={`${id}-new`} required maxLength={120} value={name} onChange={event => { setName(event.target.value); setRequestId(crypto.randomUUID()); }} disabled={busy} placeholder={building ? "เช่น อาคาร E5" : "เช่น ลิฟต์และบันไดเลื่อน"} className={`${input} flex-1 basis-44`} /><button disabled={busy || !name.trim()} type="submit" className={`min-h-12 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium hover:bg-primary-hover disabled:opacity-50 ${outline}`}>{busy ? "กำลังบันทึก…" : `เพิ่ม${label}`}</button></div>
    </form>
    {message?.error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm leading-relaxed text-red-800">{message.error}</p>}
    {message?.success && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm leading-relaxed text-emerald-800">{message.success}</p>}
    <ul className="mt-5 divide-y divide-line">{rows.map(row => <li key={row.id} className="py-4">
      {editing?.id === row.id ? <form onSubmit={event => { event.preventDefault(); update(editing, "rename"); }} className="space-y-3">
        <label htmlFor={`${id}-${row.id}`} className="block text-sm font-medium">แก้ชื่อ{label}</label><input id={`${id}-${row.id}`} required maxLength={120} autoFocus value={editName} onChange={event => setEditName(event.target.value)} disabled={busy} className={input} />
        <p className="text-xs leading-relaxed text-muted">ชื่อใหม่จะแสดงในเรื่องแจ้งเดิมด้วย</p><div className="flex flex-wrap gap-2"><button type="submit" disabled={busy || !editName.trim()} className={`${button} border-primary bg-primary/10`}>บันทึกชื่อ</button><button type="button" disabled={busy} onClick={() => setEditing(null)} className={button}>ยกเลิก</button></div>
      </form> : <div className="flex flex-wrap items-center justify-between gap-3"><div className="min-w-0 flex-1 basis-36"><p className={`break-words text-base font-medium ${row.is_active ? "text-ink" : "text-muted"}`}>{row.name}</p><span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${row.is_active ? "bg-emerald-50 text-emerald-800" : "bg-background text-muted"}`}>{row.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}</span></div><div className="flex flex-wrap gap-2"><button type="button" aria-label={`แก้ชื่อ ${row.name}`} disabled={busy} onClick={() => { setEditing(row); setEditName(row.name); setMessage(null); }} className={button}>แก้ชื่อ</button><button type="button" aria-label={`${row.is_active ? "ปิดใช้งาน" : "เปิดใช้งาน"} ${row.name}`} disabled={busy} onClick={() => update(row, "set_active")} className={`${button} ${row.is_active ? "text-muted" : "border-primary/40 bg-primary/10 text-ink"}`}>{row.is_active ? "ปิดใช้งาน" : "เปิดใช้งาน"}</button></div></div>}
    </li>)}</ul>
    {!rows.length && <p className="py-8 text-center text-sm text-muted">ยังไม่มี{label} เริ่มเพิ่มรายการแรกด้านบนได้เลย</p>}
  </section>;
}

export default function AdminSettings({ buildings, categories, buildingRequestId, categoryRequestId }: { buildings: MasterRow[]; categories: MasterRow[]; buildingRequestId: string; categoryRequestId: string }) {
  return <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-semibold">ตั้งค่าระบบ</h1><p className="mt-2 text-sm text-muted">จัดการอาคารและหมวดหมู่ที่ให้เลือกในฟอร์มแจ้งปัญหา</p></div><RefreshReports /></div>
    <p className="rounded-xl border border-primary/25 bg-primary/5 p-4 text-sm leading-relaxed">ปิดใช้งานเพื่อซ่อนจากการแจ้งเรื่องใหม่ โดยเก็บเรื่องแจ้งเดิมไว้ครบ สามารถเปิดกลับมาใช้ได้ทุกเมื่อ</p>
    <div className="grid items-start gap-6 xl:grid-cols-2"><MasterPanel table="buildings" rows={buildings} requestId={buildingRequestId} /><MasterPanel table="categories" rows={categories} requestId={categoryRequestId} /></div>
  </div>;
}
