"use client";

import { FeedbackForm } from "@/components/contributions/FeedbackForm";
import { useTranslation } from "@/i18n/I18nProvider";

export default function FeedbackPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
      <h1 className="text-2xl font-bold text-stone-900">{t("feedback.title")}</h1>
      <p className="mt-2 text-sm text-stone-600">{t("feedback.intro")}</p>
      <div className="mt-6">
        <FeedbackForm />
      </div>
    </div>
  );
}
