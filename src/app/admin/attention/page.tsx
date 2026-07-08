import { AttentionQueue } from "@/components/admin/AttentionQueue";
import { getViewerAccess } from "@/lib/contributions/access";
import { getConfirmationBacklog } from "@/lib/contributions/attentionQueue";
import { resolveConfirmationThreshold } from "@/lib/contributions/settings";

export const dynamic = "force-dynamic";

export default async function AdminAttentionPage() {
  const [markets, threshold, access] = process.env.DATABASE_URL
    ? await Promise.all([
        getConfirmationBacklog(),
        resolveConfirmationThreshold(),
        getViewerAccess(),
      ])
    : [[], 2, { isModerator: false, isSuperAdmin: false }];

  return (
    <AttentionQueue
      markets={markets}
      threshold={threshold}
      canApprove={access.isSuperAdmin}
    />
  );
}
