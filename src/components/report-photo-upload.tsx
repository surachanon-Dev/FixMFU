"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ChangeEvent } from "react";

interface PhotoPreview {
  id: string;
  file: File;
  url: string;
}

const MAX_PHOTOS = 3;
const MAX_TOTAL_BYTES = 2 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function fileKey(file: File) {
  return `${file.name}:${file.type}:${file.size}:${file.lastModified}`;
}

export function ReportPhotoUpload({ onReadingChange, onSelectionChange, label = "รูปประกอบปัญหา" }: { onReadingChange?: (reading: boolean) => void; onSelectionChange?: () => void; label?: string }) {
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedRef = useRef<PhotoPreview[]>([]);
  const urlsRef = useRef(new Set<string>());
  const mountedRef = useRef(false);
  const hintId = useId();

  function syncFiles(next: PhotoPreview[]) {
    const transfer = new DataTransfer();
    next.forEach((photo) => transfer.items.add(photo.file));
    if (inputRef.current) inputRef.current.files = transfer.files;
  }

  function saveSelection(next: PhotoPreview[]) {
    syncFiles(next);
    selectedRef.current = next;
    setPhotos(next);
    onSelectionChange?.();
  }

  function release(photo: PhotoPreview) {
    URL.revokeObjectURL(photo.url);
    urlsRef.current.delete(photo.url);
  }

  useEffect(() => {
    mountedRef.current = true;
    const urls = urlsRef.current;
    const form = inputRef.current?.form;
    const reset = () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
      selectedRef.current = [];
      setPhotos([]);
      setError("");
    };
    form?.addEventListener("reset", reset);
    return () => {
      mountedRef.current = false;
      form?.removeEventListener("reset", reset);
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  async function selectPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    const previous = selectedRef.current;
    // Keep the actual file field aligned with the previews, including rejected picks.
    syncFiles(previous);
    if (!files.length) return;
    setError("");
    const keys = new Set(previous.map((photo) => photo.id));
    const additions = files.filter((file) => {
      const key = fileKey(file);
      if (keys.has(key)) return false;
      keys.add(key);
      return true;
    });
    if (!additions.length) {
      setError("รูปที่เลือกแนบไว้แล้ว กรุณาเลือกรูปอื่น");
      return;
    }
    if (previous.length + additions.length > MAX_PHOTOS) {
      setError("แนบได้สูงสุด 3 รูป กรุณาลบรูปเดิมหรือเลือกเพิ่มให้น้อยลง");
      return;
    }
    if (additions.some((file) => !IMAGE_TYPES.includes(file.type))) {
      setError("กรุณาเลือกไฟล์รูป JPG, PNG หรือ WebP เท่านั้น");
      return;
    }
    const totalBytes = [...previous.map((photo) => photo.file), ...additions].reduce((total, file) => total + file.size, 0);
    if (totalBytes > MAX_TOTAL_BYTES) {
      setError("ขนาดรูปทั้งหมดต้องไม่เกิน 2 MB กรุณาเลือกรูปที่เล็กลงหรือลบรูปเดิม");
      return;
    }

    const previews = additions.map((file) => {
      const url = URL.createObjectURL(file);
      urlsRef.current.add(url);
      return { id: fileKey(file), file, url };
    });
    setReading(true);
    onReadingChange?.(true);
    try {
      // Decode before accepting a file so corrupt images do not become broken previews.
      await Promise.all(previews.map(async (photo) => {
        const image = new Image();
        image.src = photo.url;
        await image.decode();
      }));
      if (!mountedRef.current || previews.some((photo) => !urlsRef.current.has(photo.url))) return;
      saveSelection([...previous, ...previews]);
    } catch {
      previews.forEach(release);
      if (mountedRef.current) setError("อ่านรูปไม่สำเร็จ กรุณาเลือกไฟล์รูปที่เปิดดูได้แล้วลองอีกครั้ง");
    } finally {
      if (mountedRef.current) setReading(false);
      onReadingChange?.(false);
    }
  }

  function removePhoto(id: string) {
    const photo = selectedRef.current.find((item) => item.id === id);
    if (!photo) return;
    saveSelection(selectedRef.current.filter((item) => item.id !== id));
    release(photo);
    setError("");
  }

  return (
    <section aria-label={label} aria-busy={reading} className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium">{label} <span className="font-normal text-muted">(ไม่บังคับ)</span></h2>
        <span aria-live="polite" className="shrink-0 text-xs text-muted">{photos.length}/{MAX_PHOTOS} รูป</span>
      </div>
      <input ref={inputRef} type="file" name={photos.length ? "photos" : undefined} accept={IMAGE_TYPES.join(",")} multiple hidden disabled={reading} onChange={selectPhotos} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={reading || photos.length >= MAX_PHOTOS}
        aria-describedby={hintId}
        className="flex min-h-24 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-background/50 px-4 py-4 text-sm font-medium text-ink transition-colors hover:border-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-default disabled:opacity-60"
      >
        <svg aria-hidden="true" className="h-6 w-6 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 4 7 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2-3Z" />
          <circle cx="12" cy="14" r="4" />
        </svg>
        {reading ? "กำลังตรวจรูป…" : photos.length >= MAX_PHOTOS ? "แนบครบ 3 รูปแล้ว" : photos.length ? "เพิ่มรูปภาพอีก" : "เพิ่มรูปภาพ"}
      </button>
      <p id={hintId} className="text-xs leading-5 text-muted">แนบรูปจุดที่พบปัญหาได้สูงสุด 3 รูป · JPG, PNG หรือ WebP · ขนาดรวมไม่เกิน 2 MB</p>
      {error ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
      {photos.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo, index) => (
            <figure key={photo.id} className="min-w-0 overflow-hidden rounded-xl border border-line bg-surface">
              <div className="relative aspect-[4/3] bg-background">
                {/* Local object URLs provide immediate previews without uploading or image optimization. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt={`${label} ${index + 1}: ${photo.file.name}`} className="h-full w-full object-contain" />
                <button type="button" disabled={reading} onClick={() => removePhoto(photo.id)} aria-label={`ลบรูป ${photo.file.name}`} className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface/95 text-ink shadow-sm hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50">
                  <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg>
                </button>
              </div>
              <figcaption className="px-3 py-2">
                <p title={photo.file.name} className="truncate text-xs font-medium">{photo.file.name}</p>
                <p className="mt-1 text-xs text-muted">{Math.max(1, Math.round(photo.file.size / 1024))} KB</p>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : null}
    </section>
  );
}
