"use client";

import { useTranslation } from "@/i18n/I18nProvider";

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

/**
 * Trust badge for a contributable field. `verified` renders the green community-verified
 * pill (with confirmation count and, when known, the verified-on date); otherwise it renders
 * the amber "needs confirmation" pill.
 */
export function ContributionBadge({
  verified,
  confirmCount,
  verifiedAt,
}: {
  verified: boolean;
  confirmCount?: number | null;
  verifiedAt?: string | null;
}) {
  const { t, lang } = useTranslation();

  if (!verified) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
        <ClockIcon />
        {t("badge.needsConfirmation")}
      </span>
    );
  }

  const date = verifiedAt
    ? new Date(verifiedAt).toLocaleDateString(
        lang === "es" ? "es-CR" : "en-US",
        { year: "numeric", month: "short", day: "numeric" },
      )
    : null;

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
        <CheckIcon />
        {t("badge.verified")}
      </span>
      {typeof confirmCount === "number" && confirmCount > 0 && (
        <span className="text-xs text-stone-400">
          {t("badge.confirmations", { count: String(confirmCount) })}
        </span>
      )}
      {date && (
        <span className="text-xs text-stone-400">
          {t("badge.verifiedOn", { date })}
        </span>
      )}
    </span>
  );
}
