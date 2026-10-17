import { randomUUID } from "node:crypto";
import AdminSettings from "../../../../components/admin-settings";
import { getAdminSettings } from "../../../../lib/admin-settings";

export default async function SettingsPage() {
  const data = await getAdminSettings();
  return <AdminSettings {...data} buildingRequestId={randomUUID()} categoryRequestId={randomUUID()} />;
}
