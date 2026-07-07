"use client";

import Link from "next/link";

import { useTranslation } from "@/i18n/I18nProvider";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-3xl font-bold text-stone-900">{value}</p>
      <p className="mt-1 text-sm text-stone-500">{label}</p>
    </div>
  );
}

/** Overview cards for the /admin landing page. */
export function Dashboard({
  openReportTargets,
  openFeedback,
  superAdmins,
  threshold,
}: {
  openReportTargets: number;
  openFeedback: number;
  superAdmins: number;
  threshold: number;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t("admin.dashboard.openReports")} value={openReportTargets} />
        <Stat label={t("admin.dashboard.openFeedback")} value={openFeedback} />
        <Stat label={t("admin.dashboard.superAdmins")} value={superAdmins} />
        <Stat label={t("admin.dashboard.threshold")} value={threshold} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/reports"
          className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          {t("admin.dashboard.reportsCta")}
        </Link>
        <Link
          href="/admin/feedback"
          className="inline-flex items-center rounded-full border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
        >
          {t("admin.dashboard.feedbackCta")}
        </Link>
      </div>
    </div>
  );
}
