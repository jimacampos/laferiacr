"use client";

import { dataGeneratedAt, dataSource } from "@/data/ferias";
import { useTranslation } from "@/i18n/I18nProvider";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-3xl space-y-1 px-4 py-6 text-center text-xs text-stone-500">
        <p>{t("footer.note")}</p>
        <p>
          {t("footer.source", { source: dataSource })} ·{" "}
          {t("footer.updated", { date: dataGeneratedAt })}
        </p>
      </div>
    </footer>
  );
}
