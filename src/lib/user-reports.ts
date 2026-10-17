import "server-only";
import { requireProfile } from "./auth";
import { createClient } from "./supabase/server";
import { UUID_PATTERN } from "./report-validation";
import type { Ticket, TicketStatus } from "./tickets";

interface ReportRow {
  id: string; ticket_number: number; reporter_id: string; title: string; description: string;
  location: string; status: TicketStatus; created_at: string; updated_at: string;
  resolution: string; cancellation_reason: string;
  buildings: { name: string }; categories: { name: string };
  profiles: { id: string; full_name: string; contact: string };
  ticket_attachments: { original_name: string; object_path: string; kind: string }[];
  ticket_events: { id: number; created_at: string; actor_role: string; status: TicketStatus; message: string }[];
}

export async function getOwnReports(id?: string): Promise<Ticket[]> {
  return getReports(false, id);
}

export async function getAdminReports(id?: string): Promise<Ticket[]> {
  return getReports(true, id);
}

async function getReports(admin: boolean, id?: string): Promise<Ticket[]> {
  const profile = await requireProfile(admin);
  if (id !== undefined && !UUID_PATTERN.test(id)) return [];
  const supabase = await createClient();
  const rows: ReportRow[] = [];
  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    let query = supabase.from("tickets").select(`
    id, ticket_number, reporter_id, title, description, location, status,
    created_at, updated_at, resolution, cancellation_reason,
    buildings(name), categories(name),
    profiles!tickets_reporter_id_fkey(id, full_name, contact),
    ticket_attachments(original_name, object_path, kind),
    ticket_events(id, created_at, actor_role, status, message)
    `).order("created_at", { ascending: false }).order("id");
    if (!admin) query = query.eq("reporter_id", profile.id);
    if (id) query = query.eq("id", id);
    const result = await query.range(offset, offset + pageSize - 1);
    if (result.error || !result.data) throw new Error("REPORTS_UNAVAILABLE");
    const page = result.data as unknown as ReportRow[];
    rows.push(...page);
    if (id || page.length < pageSize) break;
  }
  const paths = [...new Set(rows.flatMap(row => row.ticket_attachments.map(photo => photo.object_path)))];
  const urls = new Map<string, string>();
  for (let offset = 0; offset < paths.length; offset += 100) {
    const batch = paths.slice(offset, offset + 100);
    const signed = await supabase.storage.from("ticket-photos").createSignedUrls(batch, 900);
    if (signed.error || signed.data?.length !== batch.length || signed.data.some(photo => photo.error || !photo.signedUrl || !photo.path)) throw new Error("REPORT_PHOTOS_UNAVAILABLE");
    for (const photo of signed.data ?? []) if (photo.path && photo.signedUrl) urls.set(photo.path, photo.signedUrl);
  }
  return rows.map(row => ({
    id: row.id, number: `REQ-${String(row.ticket_number).padStart(3, "0")}`,
    title: row.title, description: row.description, location: row.location,
    building: row.buildings.name, category: row.categories.name,
    reporter: { id: row.reporter_id, name: row.profiles.full_name, contact: admin ? row.profiles.contact : "" },
    status: row.status, createdAt: row.created_at, updatedAt: row.updated_at,
    resolution: row.resolution, cancellationReason: row.cancellation_reason,
    photos: row.ticket_attachments.filter(photo => photo.kind === "report").map(photo => ({ name: photo.original_name, dataUrl: urls.get(photo.object_path)! })),
    repairPhotos: row.ticket_attachments.filter(photo => photo.kind === "repair").map(photo => ({ name: photo.original_name, dataUrl: urls.get(photo.object_path)! })),
    history: row.ticket_events.sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id - b.id).map(event => ({
      id: String(event.id), at: event.created_at, actor: event.actor_role === "admin" ? "ผู้ดูแลระบบ" : event.actor_role === "system" ? "ระบบ" : "ผู้แจ้ง", status: event.status, message: event.message,
    })),
  }));
}
