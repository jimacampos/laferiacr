import { ReportQueue } from "@/components/admin/ReportQueue";
import { getReportQueue } from "@/lib/contributions/moderation";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const queue = process.env.DATABASE_URL ? await getReportQueue() : [];
  return <ReportQueue initial={queue} />;
}
