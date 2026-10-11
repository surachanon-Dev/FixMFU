"use client";

import { useSyncExternalStore } from "react";
import { applyTicketChange, SAMPLE_TICKETS, type Ticket, type TicketChange } from "./tickets";

const STORAGE_KEY = "fixmfu-demo-tickets-v1";
const CHANGE_EVENT = "fixmfu-tickets-changed";
let cachedRaw: string | null | undefined;
let cachedTickets = SAMPLE_TICKETS;

function isTicket(value: unknown): value is Ticket {
  if (!value || typeof value !== "object") return false;
  const ticket = value as Ticket;
  return [ticket.id, ticket.title, ticket.description, ticket.building, ticket.location, ticket.category, ticket.resolution, ticket.cancellationReason].every(value => typeof value === "string")
    && ["pending", "in_progress", "completed", "cancelled"].includes(ticket.status)
    && typeof ticket.createdAt === "string" && Number.isFinite(Date.parse(ticket.createdAt))
    && typeof ticket.updatedAt === "string" && Number.isFinite(Date.parse(ticket.updatedAt))
    && !!ticket.reporter && [ticket.reporter.id, ticket.reporter.name, ticket.reporter.contact].every(value => typeof value === "string")
    && Array.isArray(ticket.history) && ticket.history.every(event => event && typeof event.id === "string" && typeof event.message === "string" && typeof event.actor === "string" && Number.isFinite(Date.parse(event.at)) && ["pending", "in_progress", "completed", "cancelled"].includes(event.status))
    && [ticket.photos, ticket.repairPhotos].every(photos => Array.isArray(photos) && photos.every(photo => photo && typeof photo.name === "string" && typeof photo.dataUrl === "string" && /^data:image\/(png|jpeg|webp);base64,/.test(photo.dataUrl)));
}

function getSnapshot(): Ticket[] {
  let raw: string | null;
  try { raw = window.localStorage.getItem(STORAGE_KEY); } catch { return SAMPLE_TICKETS; }
  if (raw === cachedRaw) return cachedTickets;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : SAMPLE_TICKETS;
    cachedTickets = Array.isArray(parsed) && parsed.every(isTicket) && new Set(parsed.map(ticket => ticket.id)).size === parsed.length ? parsed : SAMPLE_TICKETS;
  } catch { cachedTickets = SAMPLE_TICKETS; }
  return cachedTickets;
}

function subscribe(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => { if (event.key === STORAGE_KEY || event.key === null) onChange(); };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => { window.removeEventListener("storage", onStorage); window.removeEventListener(CHANGE_EVENT, onChange); };
}

const getServerSnapshot = (): null => null;

export function useTickets(): Ticket[] | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function updateTicket(id: string, change: TicketChange): void {
  const tickets = getSnapshot();
  const ticket = tickets.find(ticket => ticket.id === id);
  if (!ticket) throw new Error("ไม่พบเรื่องแจ้งนี้");
  const updated = applyTicketChange(ticket, change, new Date().toISOString());
  const next = tickets.map(ticket => ticket.id === id ? updated : ticket);
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
  catch { throw new Error("บันทึกไม่สำเร็จ พื้นที่จัดเก็บอาจเต็มหรือเบราว์เซอร์ไม่อนุญาตให้บันทึก ลองลดจำนวนหรือขนาดรูปแล้วบันทึกอีกครั้ง"); }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
