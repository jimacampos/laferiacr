"use client";

import Link from "next/link";

import { useTranslation } from "@/i18n/I18nProvider";

/** Translated "Add a market" CTA link, usable from server pages. */
export function AddMarketButton() {
  const { t } = useTranslation();
  return (
    <Link
      href="/markets/new"
      className="shrink-0 inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
    >
      {t("nav.addMarket")}
    </Link>
  );
}
