export const STATUS_LABELS = {
  pending: "รอรับเรื่อง",
  in_progress: "กำลังดำเนินการ",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
} as const;

export type TicketStatus = keyof typeof STATUS_LABELS;
export interface TicketAttachment { name: string; dataUrl: string }
export interface TicketEvent {
  id: string;
  at: string;
  actor: string;
  status: TicketStatus;
  message: string;
}
export interface Ticket {
  id: string;
  number?: string;
  title: string;
  description: string;
  building: string;
  location: string;
  category: string;
  reporter: { id: string; name: string; contact: string };
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  photos: TicketAttachment[];
  repairPhotos: TicketAttachment[];
  resolution: string;
  cancellationReason: string;
  history: TicketEvent[];
}
export const DEMO_USER_ID = "demo-user";

function exampleTicket(
  id: string, title: string, building: string, location: string,
  category: string, status: TicketStatus, createdAt: string,
  description: string, own = false,
): Ticket {
  const history: TicketEvent[] = [{ id: `${id}-created`, at: createdAt, actor: "ผู้แจ้ง", status: "pending", message: "ส่งเรื่องแจ้งซ่อมเข้าสู่ระบบ" }];
  if (status !== "pending") history.push({ id: `${id}-accepted`, at: createdAt, actor: "ผู้ดูแลระบบ", status: "in_progress", message: "รับเรื่องและประสานงานช่างเข้าตรวจสอบ" });
  if (status === "completed" || status === "cancelled") history.push({ id: `${id}-closed`, at: createdAt, actor: "ผู้ดูแลระบบ", status, message: status === "completed" ? "แก้ไขและตรวจสอบการใช้งานเรียบร้อยแล้ว" : "ยกเลิกเนื่องจากแจ้งเรื่องซ้ำ" });
  return {
    id, title, description, building, location, category, status, createdAt, updatedAt: createdAt,
    reporter: own ? { id: DEMO_USER_ID, name: "นักศึกษาตัวอย่าง", contact: "student@example.com" } : { id: `reporter-${id}`, name: "ผู้แจ้งตัวอย่าง", contact: "reporter@example.com" },
    photos: [], repairPhotos: [], history,
    resolution: status === "completed" ? "แก้ไขและตรวจสอบการใช้งานเรียบร้อยแล้ว" : "",
    cancellationReason: status === "cancelled" ? "แจ้งเรื่องซ้ำ" : "",
  };
}

export const SAMPLE_TICKETS: Ticket[] = [
  exampleTicket("REQ-001", "แอร์ห้องเรียน E4-301 ไม่เย็น", "อาคาร E4", "ห้อง E4-301", "แอร์/ประปา", "in_progress", "2026-10-11T10:30:00+07:00", "เปิดแอร์มา 2 ชั่วโมงแล้วยังไม่เย็น รบกวนช่างเข้ามาตรวจสอบ ช่วงบ่ายมีเรียนต่อ", true),
  exampleTicket("REQ-002", "หลอดไฟทางเดิน M-Square ขาด", "M-Square", "ทางเดินชั้น 2 ฝั่งห้องน้ำชาย", "ไฟฟ้า", "pending", "2026-10-10T16:00:00+07:00", "หลอดไฟขาด 2 ดวง ทางเดินมืดมากตอนเย็น", true),
  exampleTicket("REQ-003", "ท่อน้ำซึมในห้องน้ำชั้น 2 หอ F1", "หอพัก F1", "ห้องน้ำชั้น 2", "แอร์/ประปา", "completed", "2026-10-08T09:15:00+07:00", "น้ำซึมจากท่อใต้อ่างล้างมือ ทำให้พื้นเปียก", true),
  exampleTicket("REQ-004", "อินเทอร์เน็ตห้องเรียนใช้งานไม่ได้", "อาคาร E4", "ห้อง E4-204", "อินเทอร์เน็ต", "pending", "2026-10-11T11:00:00+07:00", "เชื่อมต่อเครือข่ายได้แต่เข้าเว็บไซต์ไม่ได้"),
  exampleTicket("REQ-005", "ปลั๊กไฟห้องอ่านหนังสือชำรุด", "M-Square", "ห้องอ่านหนังสือชั้น 1", "ไฟฟ้า", "in_progress", "2026-10-09T14:20:00+07:00", "ปลั๊กไฟบริเวณโต๊ะกลางห้องหลวมและใช้งานไม่ได้"),
  exampleTicket("REQ-006", "แจ้งหลอดไฟทางเดินซ้ำ", "M-Square", "ทางเดินชั้น 2", "ไฟฟ้า", "cancelled", "2026-10-10T16:30:00+07:00", "ปัญหาเดียวกับใบแจ้ง REQ-002"),
  exampleTicket("REQ-007", "ก๊อกน้ำห้องน้ำปิดไม่สนิท", "หอพัก F1", "ห้องน้ำชั้น 1", "แอร์/ประปา", "completed", "2026-09-21T10:00:00+07:00", "มีน้ำหยดตลอดเวลาแม้ปิดก๊อกแล้ว"),
  exampleTicket("REQ-008", "ไฟห้องเรียนกะพริบ", "อาคาร E4", "ห้อง E4-102", "ไฟฟ้า", "completed", "2026-08-18T09:00:00+07:00", "หลอดไฟกะพริบระหว่างเรียน"),
];

export function formatDate(value: string, withTime = false): string {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium", ...(withTime ? { timeStyle: "short" as const } : {}), timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

export function ticketMonth(ticket: Ticket): string {
  // Stored timestamps use Bangkok time; normalize imported timestamps too.
  const date = new Date(new Date(ticket.createdAt).getTime() + 7 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 7);
}

export function formatMonth(value: string): string {
  return new Intl.DateTimeFormat("th-TH", { month: "long", year: "numeric", timeZone: "Asia/Bangkok" }).format(new Date(`${value}-01T00:00:00+07:00`));
}

export function countBy(tickets: Ticket[], field: "category" | "building"): [string, number][] {
  const counts = new Map<string, number>();
  for (const ticket of tickets) counts.set(ticket[field], (counts.get(ticket[field]) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "th"));
}

export type TicketChange =
  | { type: "note"; note: string }
  | { type: "status"; status: "in_progress" | "completed" | "cancelled"; note: string; photos?: TicketAttachment[] };

export function applyTicketChange(ticket: Ticket, change: TicketChange, now: string): Ticket {
  if (ticket.status === "completed" || ticket.status === "cancelled") throw new Error("เรื่องนี้ปิดแล้ว ไม่สามารถแก้ไขได้");
  const note = change.note.trim();
  if (note.length > 1500) throw new Error("ข้อความต้องไม่เกิน 1,500 ตัวอักษร");
  let status: TicketStatus = ticket.status;
  let message = note;
  let resolution = ticket.resolution;
  let cancellationReason = ticket.cancellationReason;
  let repairPhotos = ticket.repairPhotos;
  if (change.type === "note") {
    if (!note) throw new Error("กรุณาระบุหมายเหตุ");
  } else {
    status = change.status;
    if (status === "in_progress" && ticket.status !== "pending") throw new Error("เรื่องนี้รับดำเนินการแล้ว");
    if (status === "completed" && ticket.status !== "in_progress") throw new Error("กรุณารับเรื่องก่อนปิดงาน");
    if (status === "completed") {
      repairPhotos = change.photos ?? [];
      if (repairPhotos.length > 3 || repairPhotos.some(photo => !/^data:image\/(png|jpeg|webp);base64,/.test(photo.dataUrl))) throw new Error("รูปภาพผลการแก้ไขไม่ถูกต้อง");
      if (!note && repairPhotos.length === 0) throw new Error("กรุณาระบุผลการแก้ไขหรือแนบรูปก่อนปิดงาน");
      resolution = note;
      message = `ปิดงานเรียบร้อย${note ? `: ${note}` : ""}${repairPhotos.length ? ` (แนบรูป ${repairPhotos.length} รูป)` : ""}`;
    } else if (status === "cancelled") {
      if (!note) throw new Error("กรุณาระบุเหตุผลที่ยกเลิก");
      cancellationReason = note;
      message = `ยกเลิกเรื่อง: ${note}`;
    } else {
      message = `รับเรื่องและเริ่มดำเนินการ${note ? `: ${note}` : ""}`;
    }
  }
  return { ...ticket, status, resolution, cancellationReason, repairPhotos, updatedAt: now,
    history: [...ticket.history, { id: `${ticket.id}-${now}-${ticket.history.length}`, at: now, actor: "ผู้ดูแลระบบ", status, message }],
  };
}
