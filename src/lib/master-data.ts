import { ReportError, UUID_PATTERN } from "./report-validation";

export type MasterTable = "buildings" | "categories";
export interface MasterRow { id: string; code: string; name: string; is_active: boolean; updated_at: string }
export type MasterMutation =
  | { table: MasterTable; intent: "create"; requestId: string; name: string }
  | { table: MasterTable; intent: "rename"; id: string; updatedAt: string; name: string }
  | { table: MasterTable; intent: "set_active"; id: string; updatedAt: string; active: boolean };

export function validateMasterMutation(form: FormData): MasterMutation {
  const text = (key: string) => typeof form.get(key) === "string" ? (form.get(key) as string).trim() : "";
  const table = text("table");
  const intent = text("intent");
  if (table !== "buildings" && table !== "categories") throw new ReportError("รายการตั้งค่าไม่ถูกต้อง");
  if (!["create", "rename", "set_active"].includes(intent)) throw new ReportError("คำสั่งตั้งค่าไม่ถูกต้อง");
  const name = text("name");
  if (intent !== "set_active" && (!name || Array.from(name).length > 120)) throw new ReportError("กรุณากรอกชื่อไม่เกิน 120 ตัวอักษร");
  if (intent === "create") {
    const requestId = text("requestId");
    if (!UUID_PATTERN.test(requestId)) throw new ReportError("ข้อมูลคำขอไม่ถูกต้อง กรุณาโหลดหน้าใหม่");
    return { table, intent, requestId, name };
  }
  const id = text("id");
  const updatedAt = text("updatedAt");
  if (!UUID_PATTERN.test(id) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(updatedAt) || !Number.isFinite(Date.parse(updatedAt))) throw new ReportError("ข้อมูลรายการไม่ถูกต้อง กรุณาอัปเดตข้อมูลก่อนลองอีกครั้ง");
  if (intent === "rename") return { table, intent, id, updatedAt, name };
  const active = text("active");
  if (active !== "true" && active !== "false") throw new ReportError("สถานะใช้งานไม่ถูกต้อง");
  return { table, intent: "set_active", id, updatedAt, active: active === "true" };
}
