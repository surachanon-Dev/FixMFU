"use server";

import { revalidatePath } from "next/cache";
import { getAuthState } from "../../../../lib/auth";
import { createClient } from "../../../../lib/supabase/server";
import { validateAdminTicket } from "../../../../lib/admin-ticket-validation";
import { prepareReportImages } from "../../../../lib/report-images";
import { ReportError, reportFiles } from "../../../../lib/report-validation";

export interface AdminTicketResult { error?: string; success?: string; refresh?: boolean }

export async function updateAdminTicket(form: FormData): Promise<AdminTicketResult> {
  const auth = await getAuthState();
  if (auth.error || !auth.profile) return { error: "เซสชันหมดอายุหรือยืนยันบัญชีไม่ได้ กรุณาเข้าสู่ระบบใหม่" };
  if (auth.profile.role !== "admin") return { error: "บัญชีนี้ไม่มีสิทธิ์ดำเนินการเรื่องแจ้งซ่อม" };
  try {
    const fields = validateAdminTicket(form);
    const files = reportFiles(form);
    if (fields.action !== "complete" && files.length) throw new ReportError("แนบรูปผลการแก้ไขได้เฉพาะตอนปิดงาน");
    if (fields.action === "complete" && !fields.note && !files.length) throw new ReportError("กรุณาระบุผลการแก้ไขหรือแนบรูปก่อนปิดงาน");
    const supabase = await createClient();
    const current = await supabase.from("tickets").select("id, status").eq("id", fields.ticketId).maybeSingle();
    if (current.error) return { error: "ตรวจสอบเรื่องแจ้งไม่สำเร็จ กรุณาลองอีกครั้ง" };
    if (!current.data) return { error: "ไม่พบเรื่องแจ้งซ่อม กรุณากลับไปเลือกรายการใหม่", refresh: true };
    const photos = await prepareReportImages(fields.ticketId, files, "repair");
    const args = { p_request_id: fields.requestId, p_ticket_id: fields.ticketId, p_expected_status: fields.expectedStatus,
      p_action: fields.action, p_note: fields.note, p_photos: photos.map(photo => photo.metadata) };
    // If a previous attempt already committed, the RPC can return its original
    // result even after the status changed. Do not re-upload to a closed ticket.
    if (current.data.status === fields.expectedStatus) {
      const uploaded: string[] = [];
      for (const photo of photos) {
        const result = await supabase.storage.from("ticket-photos").upload(photo.metadata.object_path, photo.bytes, { contentType: "image/webp", upsert: false });
        if (result.error) {
          const retry = await supabase.storage.from("ticket-photos").download(photo.metadata.object_path);
          const same = !retry.error && retry.data && Buffer.from(await retry.data.arrayBuffer()).equals(photo.bytes);
          if (!same) {
            if (uploaded.length) await supabase.storage.from("ticket-photos").remove(uploaded);
            return { error: "อัปโหลดรูปผลการแก้ไขไม่สำเร็จ กรุณาลองด้วยข้อมูลเดิม หากเพิ่งตั้งระบบให้รัน SQL 04 ก่อน" };
          }
        } else uploaded.push(photo.metadata.object_path);
      }
    }
    const result = await supabase.rpc("admin_update_ticket", args);
    if (result.error) {
      // A network failure may follow a successful commit. Keep files and the
      // request ID so retrying cannot duplicate notes, events or attachments.
      if (["PGRST202", "42883"].includes(result.error.code)) return { error: "กรุณารันไฟล์ 04_admin_ticket_actions.sql ใน Supabase ก่อนใช้ปุ่มดำเนินการ" };
      if (result.error.code === "40001") return { error: "สถานะเรื่องเปลี่ยนแล้ว ระบบจะโหลดข้อมูลล่าสุด กรุณาตรวจสอบก่อนดำเนินการอีกครั้ง", refresh: true };
      if (result.error.code === "42501") return { error: "ตรวจสิทธิ์ผู้ดูแลหรือสิทธิ์รูปภาพไม่ผ่าน กรุณาอัปเดตข้อมูลหรือล็อกอินใหม่" };
      if (result.error.code === "P0002") return { error: "ไม่พบเรื่องแจ้งซ่อม กรุณากลับไปเลือกรายการใหม่", refresh: true };
      if (result.error.code === "22023") return { error: "ข้อมูลดำเนินการไม่ตรงกัน กรุณาตรวจประวัติแล้วโหลดหน้ารายละเอียดใหม่" };
      return { error: "ยังยืนยันการบันทึกไม่ได้ กรุณาลองด้วยข้อมูลเดิม หรือตรวจประวัติก่อน ระบบจะป้องกันรายการซ้ำให้" };
    }
    if (result.data !== fields.ticketId) return { error: "ยังยืนยันการบันทึกไม่ได้ กรุณาตรวจประวัติก่อนลองด้วยข้อมูลเดิม" };
    for (const path of ["/admin/tickets", "/admin/dashboard", "/admin/reports", `/admin/tickets/${fields.ticketId}`, "/user", `/user/ticket/${fields.ticketId}`]) revalidatePath(path);
    const messages = { receive: "รับเรื่องแล้ว สถานะเปลี่ยนเป็นกำลังดำเนินการ", note: "บันทึกหมายเหตุแล้ว ผู้แจ้งดูข้อความได้ในประวัติ", complete: "บันทึกผลการแก้ไขและปิดงานแล้ว", cancel: "ยกเลิกเรื่องพร้อมบันทึกเหตุผลแล้ว" };
    return { success: messages[fields.action], refresh: true };
  } catch (error) {
    return { error: error instanceof ReportError ? error.message : "การเชื่อมต่อขัดข้อง กรุณาลองด้วยข้อมูลเดิม หรือตรวจประวัติก่อน" };
  }
}
