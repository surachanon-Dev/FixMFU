"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => { window.removeEventListener("online", callback); window.removeEventListener("offline", callback); };
}

export default function ConnectionStatus() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  if (online) return null;
  return <p role="status" className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm leading-relaxed text-amber-900">ขณะนี้ออฟไลน์ กรุณาเชื่อมต่ออินเทอร์เน็ตก่อนส่งเรื่องหรือบันทึกการเปลี่ยนแปลง</p>;
}
