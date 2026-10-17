import "server-only";
import { requireProfile } from "./auth";
import { createClient } from "./supabase/server";
import type { MasterRow, MasterTable } from "./master-data";

export async function getAdminSettings(): Promise<{ buildings: MasterRow[]; categories: MasterRow[] }> {
  await requireProfile(true);
  const supabase = await createClient();
  async function read(table: MasterTable): Promise<MasterRow[]> {
    const rows: MasterRow[] = [];
    for (let offset = 0; ; offset += 500) {
      const result = await supabase.from(table).select("id, code, name, is_active, updated_at").order("name").order("id").range(offset, offset + 499);
      if (result.error || !result.data) throw new Error("SETTINGS_UNAVAILABLE");
      rows.push(...result.data);
      if (result.data.length < 500) return rows;
    }
  }
  const [buildings, categories] = await Promise.all([read("buildings"), read("categories")]);
  return { buildings, categories };
}
