"use client";

import Link from "next/link";

import { useTranslation } from "@/i18n/I18nProvider";

export default function MarketNotFound() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:py-16">
      <h1 className="text-xl font-bold text-stone-900 sm:text-2xl">
        {t("detail.notFound.title")}
      </h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">
        {t("detail.notFound.message")}
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
      >
        {t("detail.back")}
      </Link>
    </div>
  );
}
