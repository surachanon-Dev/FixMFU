"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import type { TicketAttachment } from "../lib/tickets";

export default function AttachmentGallery({ photos, emptyText }: { photos: TicketAttachment[]; emptyText: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState<string[]>([]);
  const selected = photos[active] ?? photos[0];
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  if (!photos.length) return <p className="text-sm text-muted">{emptyText}</p>;
  function show(index: number) { setActive(index); setOpen(true); dialog.current?.showModal(); }
  function move(delta: number) { setActive(index => (index + delta + photos.length) % photos.length); }
  function keys(event: KeyboardEvent<HTMLDialogElement>) {
    if (photos.length < 2 || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault(); move(event.key === "ArrowRight" ? 1 : -1);
  }
  function fail(url: string) { setFailed(previous => previous.includes(url) ? previous : [...previous, url]); }
  const missing = <span className="flex min-h-40 items-center justify-center p-5 text-center text-sm leading-relaxed text-muted">ยังเปิดรูปไม่ได้<br />ลองกดอัปเดตข้อมูลเพื่อโหลดรูปใหม่</span>;

  return <>
    <div className="grid gap-3 sm:grid-cols-2">{photos.map((photo, index) => <button type="button" key={`${photo.name}-${index}`} onClick={() => show(index)} aria-label={`ขยายรูป ${index + 1}: ${photo.name}`} className="group overflow-hidden rounded-xl border border-line bg-surface text-left transition hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
      {failed.includes(photo.dataUrl) ? missing : <>
        {/* Private Storage signed URLs are fetched directly and are never sent to an image optimizer. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.dataUrl} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => fail(photo.dataUrl)} className="h-44 w-full bg-background/40 object-contain" />
      </>}
      <span className="flex items-center justify-between gap-3 border-t border-line px-3 py-3 text-xs"><span className="truncate text-muted">{photo.name}</span><span className="shrink-0 font-medium text-ink group-hover:underline">ขยายรูป ↗</span></span>
    </button>)}</div>
    <dialog ref={dialog} aria-labelledby={titleId} onClose={() => setOpen(false)} onKeyDown={keys} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }} className="fixed m-auto max-h-[calc(100dvh-2rem)] w-[min(64rem,calc(100vw-2rem))] max-w-none overflow-y-auto rounded-2xl border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-ink/70">
      <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3"><div className="min-w-0"><h2 id={titleId} className="truncate text-sm font-medium">{selected?.name}</h2><p aria-live="polite" className="mt-1 text-xs text-muted">รูปที่ {active + 1} จาก {photos.length}</p></div><button type="button" autoFocus onClick={() => dialog.current?.close()} className="min-h-11 shrink-0 rounded-xl border border-line px-4 py-2 text-sm font-medium hover:bg-background focus-visible:outline-2 focus-visible:outline-primary">ปิดรูป ×</button></div>
      <div className="flex min-h-40 items-center justify-center bg-background/30 p-3">{selected && (failed.includes(selected.dataUrl) ? missing : <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={selected.dataUrl} alt={selected.name} referrerPolicy="no-referrer" onError={() => fail(selected.dataUrl)} className="max-h-[calc(100dvh-14rem)] w-full object-contain" />
      </>)}</div>
      {photos.length > 1 && <div className="flex items-center justify-between gap-3 border-t border-line p-3"><button type="button" onClick={() => move(-1)} className="min-h-11 rounded-xl border border-line px-4 py-2 text-sm hover:bg-background focus-visible:outline-2 focus-visible:outline-primary">← รูปก่อนหน้า</button><button type="button" onClick={() => move(1)} className="min-h-11 rounded-xl border border-line px-4 py-2 text-sm hover:bg-background focus-visible:outline-2 focus-visible:outline-primary">รูปถัดไป →</button></div>}
    </dialog>
  </>;
}
