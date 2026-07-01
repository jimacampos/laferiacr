import { AuditTable } from "@/components/admin/AuditTable";
import { listModerationActions } from "@/lib/contributions/moderation";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  const entries = process.env.DATABASE_URL ? await listModerationActions() : [];
  return <AuditTable entries={entries} />;
}
