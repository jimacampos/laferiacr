import { redirect } from "next/navigation";

import { SettingsForm } from "@/components/admin/SettingsForm";
import { getViewerAccess } from "@/lib/contributions/access";
import {
  CONFIRMATION_THRESHOLD_KEY,
  resolveConfirmationThreshold,
} from "@/lib/contributions/settings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const access = await getViewerAccess();
  if (!access.isSuperAdmin) redirect("/admin");

  const threshold = process.env.DATABASE_URL
    ? await resolveConfirmationThreshold()
    : 2;

  return (
    <SettingsForm
      thresholdKey={CONFIRMATION_THRESHOLD_KEY}
      initialThreshold={threshold}
    />
  );
}
