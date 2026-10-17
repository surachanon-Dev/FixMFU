import { ReportError, UUID_PATTERN } from "./report-validation";

export type AdminTicketAction = "receive" | "note" | "complete" | "cancel";
export interface AdminTicketFields {
  requestId: string; ticketId: string; expectedStatus: "pending" | "in_progress";
  action: AdminTicketAction; note: string;
}

export function validateAdminTicket(form: FormData): AdminTicketFields {
  const value = (key: string) => typeof form.get(key) === "string" ? (form.get(key) as string).trim() : "";
  const requestId = value("requestId");
  const ticketId = value("ticketId");
  const action = value("action");
  const expectedStatus = value("expectedStatus");
  const note = value("note");
  if (![requestId, ticketId].every(id => UUID_PATTERN.test(id))
      || !["pending", "in_progress"].includes(expectedStatus)
      || !["receive", "note", "complete", "cancel"].includes(action)) throw new ReportError("ข้อมูลดำเนินการไม่ถูกต้อง กรุณาโหลดหน้ารายละเอียดใหม่");
  if (Array.from(note).length > 1500) throw new ReportError("ข้อความต้องไม่เกิน 1,500 ตัวอักษร");
  if ((action === "note" || action === "cancel") && !note) throw new ReportError(action === "cancel" ? "กรุณาระบุเหตุผลที่ยกเลิก" : "กรุณากรอกหมายเหตุถึงผู้แจ้ง");
  if (action === "receive" && expectedStatus !== "pending") throw new ReportError("เรื่องนี้รับดำเนินการแล้ว กรุณาอัปเดตข้อมูล");
  if (action === "complete" && expectedStatus !== "in_progress") throw new ReportError("กรุณารับเรื่องก่อนปิดงาน");
  return { requestId, ticketId, action: action as AdminTicketAction, expectedStatus: expectedStatus as AdminTicketFields["expectedStatus"], note };
}
