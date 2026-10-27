export const REPORT_TEXT_FIELDS = ["title", "location", "details"] as const;
export type ReportTextField = (typeof REPORT_TEXT_FIELDS)[number];
export type ReportFormField = ReportTextField | "building" | "category";
export type ReportFormErrors = Partial<Record<ReportFormField, string>>;

export const REPORT_TEXT_LIMITS: Record<ReportTextField, number> = { title: 200, location: 300, details: 5000 };
const labels: Record<ReportFormField, string> = { title: "หัวข้อปัญหา", location: "ห้องหรือจุดที่พบปัญหา", details: "รายละเอียด", building: "อาคาร", category: "หมวดหมู่ปัญหา" };

/** Client feedback only; the Server Action remains the authority for validation. */
export function reportFormErrors(values: Record<ReportFormField, string>, buildingIds: readonly string[], categoryIds: readonly string[]): ReportFormErrors {
  const errors: ReportFormErrors = {};
  for (const field of REPORT_TEXT_FIELDS) {
    if (!values[field].trim()) errors[field] = `กรุณากรอก${labels[field]}`;
    else if (Array.from(values[field].trim()).length > REPORT_TEXT_LIMITS[field]) errors[field] = `${labels[field]}ต้องไม่เกิน ${REPORT_TEXT_LIMITS[field].toLocaleString("th-TH")} ตัวอักษร`;
  }
  if (!buildingIds.includes(values.building)) errors.building = "กรุณาเลือกอาคารที่พบปัญหา";
  if (!categoryIds.includes(values.category)) errors.category = "กรุณาเลือกหมวดหมู่ปัญหา";
  return Object.fromEntries((["title", "building", "location", "category", "details"] as const).filter(field => errors[field]).map(field => [field, errors[field]]));
}

/** Hash links do not leave the form; other destinations can discard in-memory data. */
export function leavesReportPage(href: string, currentHref: string): boolean {
  try {
    const current = new URL(currentHref);
    const next = new URL(href, current);
    if (!["http:", "https:"].includes(next.protocol)) return false;
    return next.origin !== current.origin || next.pathname !== current.pathname || next.search !== current.search;
  } catch {
    return false;
  }
}
