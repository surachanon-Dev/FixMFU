"use server";

import { revalidatePath } from "next/cache";
import { getAuthState } from "../../../../lib/auth";
import { createClient } from "../../../../lib/supabase/server";
import { validateMasterMutation, type MasterRow } from "../../../../lib/master-data";
import { ReportError } from "../../../../lib/report-validation";

export interface SettingsResult { error?: string; success?: string; refresh?: boolean; row?: MasterRow }
const columns = "id, code, name, is_active, updated_at";

export async function saveMasterData(form: FormData): Promise<SettingsResult> {
  const auth = await getAuthState();
  if (auth.error || !auth.profile) return { error: "เซสชันหมดอายุหรือยืนยันบัญชีไม่ได้ กรุณาเข้าสู่ระบบใหม่" };
  if (auth.profile.role !== "admin") return { error: "เฉพาะผู้ดูแลระบบเท่านั้นที่จัดการอาคารและหมวดหมู่ได้" };
  try {
    const fields = validateMasterMutation(form);
    const supabase = await createClient();
    let result;
    if (fields.intent === "create") {
      // SQL 01 makes code immutable and unique. Reuse it after a lost response.
      result = await supabase.from(fields.table).insert({ code: fields.requestId, name: fields.name, is_active: true }).select(columns).maybeSingle();
      if (result.error?.code === "23505") {
        const previous = await supabase.from(fields.table).select(columns).eq("code", fields.requestId).maybeSingle();
        if (!previous.error && previous.data?.name === fields.name) result = previous;
      }
    } else {
      const changes = fields.intent === "rename" ? { name: fields.name } : { is_active: fields.active };
      // Avoid overwriting another administrator's newer edit.
      result = await supabase.from(fields.table).update(changes).eq("id", fields.id).eq("updated_at", fields.updatedAt).select(columns).maybeSingle();
    }
    if (result.error) {
      if (result.error.code === "42501") return { error: "สิทธิ์ผู้ดูแลไม่ผ่าน กรุณาเข้าสู่ระบบใหม่ หากเพิ่งตั้งระบบให้ตรวจ SQL 01 และ 02" };
      if (result.error.code === "23505") return { error: "รหัสคำขอนี้ถูกใช้แล้ว กรุณาอัปเดตข้อมูลเพื่อตรวจรายการก่อนเพิ่มใหม่", refresh: true };
      if (result.error.code === "23514") return { error: "ชื่อรายการไม่ถูกต้อง กรุณากรอกใหม่ไม่เกิน 120 ตัวอักษร" };
      return { error: "ยังยืนยันการบันทึกไม่ได้ กรุณาอัปเดตข้อมูลเพื่อตรวจรายการ หรือลองซ้ำด้วยข้อมูลเดิม" };
    }
    if (!result.data) return { error: "รายการเปลี่ยนแล้วหรือไม่พบข้อมูล ระบบจะโหลดรายการล่าสุด กรุณาตรวจสอบก่อนลองอีกครั้ง", refresh: true };
    revalidatePath("/admin", "layout");
    revalidatePath("/user", "layout");
    const label = fields.table === "buildings" ? "อาคาร" : "หมวดหมู่";
    return { row: result.data as MasterRow, refresh: true, success: fields.intent === "create" ? `เพิ่ม${label}แล้ว` : fields.intent === "rename" ? "บันทึกชื่อแล้ว" : fields.active ? "เปิดใช้งานแล้ว เลือกได้ในฟอร์มแจ้งปัญหา" : "ปิดใช้งานแล้ว เรื่องแจ้งเดิมยังอยู่ครบ" };
  } catch (error) {
    return { error: error instanceof ReportError ? error.message : "การเชื่อมต่อขัดข้อง กรุณาตรวจรายการก่อนลองซ้ำด้วยข้อมูลเดิม" };
  }
}
