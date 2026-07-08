import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TranslatedLink } from "@/components/TranslatedLink";
import { SubmissionCard } from "@/components/contributions/PendingSubmissions";
import { getViewerAccess } from "@/lib/contributions/access";
import { getSubmission } from "@/lib/contributions/submissions";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const submission = await getSubmission(id);
  if (!submission) return { title: "La Feria CR" };
  return { title: `${submission.name} — La Feria CR` };
}

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await getViewerAccess();
  const submission = await getSubmission(id, access.userId ?? undefined);
  if (!submission) notFound();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <TranslatedLink
        href="/markets/pending"
        labelKey="submissions.backToList"
        className="text-sm font-medium text-emerald-700 underline-offset-2 hover:underline"
      />
      <ul className="mt-4">
        <SubmissionCard submission={submission} canModerate={access.isModerator} />
      </ul>
    </div>
  );
}
