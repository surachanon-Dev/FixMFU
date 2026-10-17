"use server";

import { revalidatePath } from "next/cache";
import { getAuthState } from "../../../../lib/auth";
import { createClient } from "../../../../lib/supabase/server";
import { ReportError, reportFiles, validateReport } from "../../../../lib/report-validation";
import { prepareReportImages } from "../../../../lib/report-images";

export interface ReportResult { error?: string; ticketId?: string }

export async function submitReport(form: FormData): Promise<ReportResult> {
  const auth = await getAuthState();
  if (!auth.profile || auth.error) return { error: "เซสชันหมดอายุหรือยืนยันบัญชีไม่ได้ กรุณาเข้าสู่ระบบใหม่ก่อนส่งเรื่อง" };
  try {
    const fields = validateReport(form);
    const files = reportFiles(form);
    const supabase = await createClient();
    const [building, category] = await Promise.all([
      supabase.from("buildings").select("id").eq("id", fields.building).eq("is_active", true).maybeSingle(),
      supabase.from("categories").select("id").eq("id", fields.category).eq("is_active", true).maybeSingle(),
    ]);
    if (building.error || category.error) return { error: "โหลดอาคารหรือหมวดหมู่ไม่สำเร็จ กรุณาลองอีกครั้ง" };
    if (!building.data || !category.data) return { error: "อาคารหรือหมวดหมู่นี้ปิดรับเรื่องแล้ว กรุณาโหลดหน้าใหม่" };
    const photos = await prepareReportImages(fields.id, files);
    const args = { p_id: fields.id, p_building: fields.building, p_category: fields.category, p_title: fields.title, p_description: fields.details, p_location: fields.location, p_photos: photos.map(photo => photo.metadata) };
    const prior = await supabase.from("tickets").select("id").eq("id", fields.id).eq("reporter_id", auth.profile.id).maybeSingle();
    if (prior.error) return { error: "ตรวจสอบเรื่องแจ้งไม่สำเร็จ กรุณาลองอีกครั้ง" };
    if (!prior.data) {
      const uploaded: string[] = [];
      for (const photo of photos) {
        const result = await supabase.storage.from("ticket-photos").upload(photo.metadata.object_path, photo.bytes, { contentType: "image/webp", upsert: false });
        if (result.error) {
          const retry = await supabase.storage.from("ticket-photos").download(photo.metadata.object_path);
          const matches = !retry.error && retry.data && Buffer.from(await retry.data.arrayBuffer()).equals(photo.bytes);
          if (!matches) {
            if (uploaded.length) await supabase.storage.from("ticket-photos").remove(uploaded);
            return { error: "อัปโหลดรูปไม่สำเร็จ กรุณาลองส่งด้วยข้อมูลเดิม หรือตรวจเรื่องของฉันก่อน หากเพิ่งตั้งระบบให้รัน SQL 03 ก่อน" };
          }
        } else uploaded.push(photo.metadata.object_path);
      }
    }
    const result = await supabase.rpc("submit_repair_report", args);
    if (result.error) {
      // A lost response may follow a successful commit. Keep objects for a safe retry.
      if (["PGRST202", "42883"].includes(result.error.code)) return { error: "ระบบยังไม่ได้ติดตั้งส่วนส่งเรื่อง กรุณารันไฟล์ 03_submit_reports.sql ใน Supabase ก่อน" };
      if (result.error.code === "22023") return { error: "ข้อมูลไม่ตรงกับรายการที่เคยส่ง กรุณาตรวจเรื่องของฉัน หรือเปิดฟอร์มใหม่" };
      return { error: "ยังยืนยันการส่งเรื่องไม่ได้ กรุณากดส่งอีกครั้งด้วยข้อมูลเดิม ระบบจะป้องกันเรื่องซ้ำให้" };
    }
    if (result.data !== fields.id) return { error: "ยังยืนยันเลขเรื่องไม่ได้ กรุณาลองส่งอีกครั้งด้วยข้อมูลเดิม" };
    revalidatePath("/user");
    revalidatePath("/admin/tickets");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/reports");
    revalidatePath(`/user/ticket/${fields.id}`);
    return { ticketId: fields.id };
  } catch (error) {
    return { error: error instanceof ReportError ? error.message : "เชื่อมต่อไม่สำเร็จ กรุณาลองส่งอีกครั้งด้วยข้อมูลเดิม หรือตรวจเรื่องของฉันก่อน" };
  }
}
