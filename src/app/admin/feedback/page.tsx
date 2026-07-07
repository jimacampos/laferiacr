import { FeedbackQueue } from "@/components/admin/FeedbackQueue";
import {
  getFeedbackQueue,
  type FeedbackItem,
} from "@/lib/contributions/feedback";

export const dynamic = "force-dynamic";

export default async function AdminFeedbackPage() {
  const queue: FeedbackItem[] = process.env.DATABASE_URL
    ? await getFeedbackQueue()
    : [];
  // Serialize Date → ISO string for the client component.
  const initial = queue.map((item) => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
  }));
  return <FeedbackQueue initial={initial} />;
}
