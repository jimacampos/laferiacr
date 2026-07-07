"use client";

import Link from "next/link";

import { useTranslation } from "@/i18n/I18nProvider";

const SECTIONS = [
  "account",
  "suggestHours",
  "suggestLocation",
  "confirm",
  "badges",
  "report",
] as const;

export default function HelpPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
      <h1 className="text-2xl font-bold text-stone-900">{t("help.title")}</h1>
      <p className="mt-2 text-sm text-stone-600">{t("help.intro")}</p>

      <div className="mt-8 space-y-8">
        {SECTIONS.map((key) => (
          <section key={key}>
            <h2 className="text-lg font-semibold text-stone-900">
              {t(`help.${key}.title`)}
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-stone-700">
              {t(`help.${key}.body`)}
            </p>
          </section>
        ))}

        <section className="rounded-xl border border-stone-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-stone-900">
            {t("help.feedback.title")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-700">
            {t("help.feedback.body")}
          </p>
          <Link
            href="/feedback"
            className="mt-3 inline-flex items-center rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            {t("footer.feedback")}
          </Link>
        </section>
      </div>
    </div>
  );
}
