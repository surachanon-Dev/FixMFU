export const MAX_REPORT_BYTES = 2 * 1024 * 1024;
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export interface ReportFields { id: string; building: string; category: string; title: string; details: string; location: string }
export class ReportError extends Error {}

export function validateReport(form: FormData): ReportFields {
  const value = (key: string) => typeof form.get(key) === "string" ? (form.get(key) as string).trim() : "";
  const fields = { id: value("submissionId"), building: value("building"), category: value("category"), title: value("title"), details: value("details"), location: value("location") };
  if (![fields.id, fields.building, fields.category].every(id => UUID_PATTERN.test(id))) throw new ReportError("กรุณาเลือกอาคารและหมวดหมู่ใหม่ แล้วลองส่งอีกครั้ง");
  for (const [key, label, max] of [["title", "หัวข้อ", 200], ["location", "ห้องหรือจุดที่พบปัญหา", 300], ["details", "รายละเอียด", 5000]] as const) {
    if (!fields[key] || Array.from(fields[key]).length > max) throw new ReportError(`กรุณากรอก${label} ไม่เกิน ${max.toLocaleString("th-TH")} ตัวอักษร`);
  }
  return fields;
}

export function reportFiles(form: FormData): File[] {
  const values = form.getAll("photos");
  if (values.some(value => typeof value === "string")) throw new ReportError("ข้อมูลรูปไม่ถูกต้อง กรุณาเลือกรูปใหม่");
  const files = (values as File[]).filter(file => file.size || file.name);
  if (files.length > 3) throw new ReportError("แนบรูปได้สูงสุด 3 รูป");
  if (files.reduce((sum, file) => sum + file.size, 0) > MAX_REPORT_BYTES) throw new ReportError("ขนาดรูปทั้งหมดต้องไม่เกิน 2 MB");
  if (files.some(file => !file.size || !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.name.length > 255)) throw new ReportError("กรุณาใช้รูป JPG, PNG หรือ WebP ที่มีชื่อไฟล์ไม่เกิน 255 ตัวอักษร");
  return files;
}
