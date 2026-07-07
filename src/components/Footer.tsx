"use client";

import Link from "next/link";

import { dataGeneratedAt, dataSource } from "@/data/ferias";
import { useTranslation } from "@/i18n/I18nProvider";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-5xl space-y-2 px-4 py-6 text-center text-xs text-stone-500">
        <nav className="flex items-center justify-center gap-4">
          <Link
            href="/help"
            className="font-medium text-emerald-700 underline-offset-2 hover:underline"
          >
            {t("footer.help")}
          </Link>
          <Link
            href="/feedback"
            className="font-medium text-emerald-700 underline-offset-2 hover:underline"
          >
            {t("footer.feedback")}
          </Link>
        </nav>
        <p>{t("footer.note")}</p>
        <p>
          {t("footer.source", { source: dataSource })} ·{" "}
          {t("footer.updated", { date: dataGeneratedAt })}
        </p>
        <p>{t("footer.privacy")}</p>
      </div>
    </footer>
  );
}
