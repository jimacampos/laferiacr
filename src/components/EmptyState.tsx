"use client";

import { useTranslation } from "@/i18n/I18nProvider";

export function EmptyState({
  query = "",
  onClear,
}: {
  query?: string;
  onClear?: () => void;
}) {
  const { t } = useTranslation();
  const trimmed = query.trim();

  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center">
      <p className="text-base font-semibold text-stone-800">
        {t("empty.title")}
      </p>
      <p className="mt-1 text-sm text-stone-500">
        {trimmed ? t("empty.query", { query: trimmed }) : t("empty.message")}
      </p>
      {trimmed && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 inline-flex items-center rounded-full bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
        >
          {t("empty.clear")}
        </button>
      )}
    </div>
  );
}
