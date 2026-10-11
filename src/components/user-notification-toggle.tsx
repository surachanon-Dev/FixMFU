"use client";

import { useState, useSyncExternalStore } from "react";
import BellToggle from "./bell-toggle";

const STORAGE_KEY = "fixmfu-demo-notifications-v1";
const CHANGE_EVENT = "fixmfu-notification-preference-changed";

function subscribe(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => { if (event.key === STORAGE_KEY || event.key === null) onChange(); };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => { window.removeEventListener("storage", onStorage); window.removeEventListener(CHANGE_EVENT, onChange); };
}

function getSnapshot(): boolean {
  try { return window.localStorage.getItem(STORAGE_KEY) === "true"; }
  catch { return false; }
}
const getServerSnapshot = () => false;

export default function UserNotificationToggle() {
  const enabled = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [error, setError] = useState("");
  const change = (pressed: boolean) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(pressed));
      window.dispatchEvent(new Event(CHANGE_EVENT));
      setError("");
    } catch { setError("บันทึกการตั้งค่าไม่ได้ เบราว์เซอร์ไม่อนุญาตให้จัดเก็บข้อมูล"); }
  };

  return <section aria-labelledby="user-notification-title" className="mb-6 rounded-xl border border-line bg-surface p-5">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h2 id="user-notification-title" className="font-medium">การแจ้งเตือน</h2><p className="mt-1 text-sm text-muted">ทดลองปุ่มเปิด–ปิดการแจ้งเตือน</p></div>
      <BellToggle label="เปิดหรือปิดการแจ้งเตือน" pressed={enabled} onChange={change} badge={false} />
    </div>
    <p className="mt-3 text-xs text-muted">ขณะนี้เป็นตัวอย่าง ยังไม่ส่งการแจ้งเตือนจริง</p>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
  </section>;
}
