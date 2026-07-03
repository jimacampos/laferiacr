import { AttentionQueue } from "@/components/admin/AttentionQueue";
import { getConfirmationBacklog } from "@/lib/contributions/attentionQueue";
import { resolveConfirmationThreshold } from "@/lib/contributions/settings";

export const dynamic = "force-dynamic";

export default async function AdminAttentionPage() {
  const [markets, threshold] = process.env.DATABASE_URL
    ? await Promise.all([
        getConfirmationBacklog(),
        resolveConfirmationThreshold(),
      ])
    : [[], 2];

  return <AttentionQueue markets={markets} threshold={threshold} />;
}
