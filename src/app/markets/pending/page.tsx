import type { Metadata } from "next";

import { TranslatedHeading } from "@/components/TranslatedHeading";
import { AddMarketButton } from "@/components/contributions/AddMarketButton";
import { PendingSubmissions } from "@/components/contributions/PendingSubmissions";
import { getViewerAccess } from "@/lib/contributions/access";
import { listPendingSubmissions } from "@/lib/contributions/submissions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export const metadata: Metadata = {
  title: "Ferias propuestas — La Feria CR",
};

export default async function PendingSubmissionsPage() {
  const access = await getViewerAccess();
  const { items, total } = await listPendingSubmissions(
    1,
    PAGE_SIZE,
    access.userId ?? undefined,
  );

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <div className="flex items-start justify-between gap-3">
        <TranslatedHeading
          titleKey="submissions.title"
          subtitleKey="submissions.subtitle"
        />
        <div className="mt-1">
          <AddMarketButton />
        </div>
      </div>
      <div className="mt-6">
        <PendingSubmissions
          initial={items}
          total={total}
          canModerate={access.isModerator}
        />
      </div>
    </div>
  );
}
