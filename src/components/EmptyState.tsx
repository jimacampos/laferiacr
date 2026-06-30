"use client";

import { useTranslation } from "@/i18n/I18nProvider";

export function EmptyState() {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center">
      <p className="text-base font-semibold text-stone-800">
        {t("empty.title")}
      </p>
      <p className="mt-1 text-sm text-stone-500">{t("empty.message")}</p>
    </div>
  );
}
