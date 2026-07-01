import { Dashboard } from "@/components/admin/Dashboard";
import { getReportQueue } from "@/lib/contributions/moderation";
import { countSuperAdmins } from "@/lib/contributions/roleAdmin";
import { resolveConfirmationThreshold } from "@/lib/contributions/settings";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const dbReady = Boolean(process.env.DATABASE_URL);

  const [queue, superAdmins, threshold] = dbReady
    ? await Promise.all([
        getReportQueue(1000),
        countSuperAdmins(),
        resolveConfirmationThreshold(),
      ])
    : [[], 0, 2];

  return (
    <Dashboard
      openReportTargets={queue.length}
      superAdmins={superAdmins}
      threshold={threshold}
    />
  );
}
