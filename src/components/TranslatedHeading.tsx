"use client";

import { useTranslation } from "@/i18n/I18nProvider";

/** Small client-side page heading that resolves its title/subtitle through i18n. */
export function TranslatedHeading({
  titleKey,
  subtitleKey,
}: {
  titleKey: string;
  subtitleKey?: string;
}) {
  const { t } = useTranslation();
  return (
    <header>
      <h1 className="text-2xl font-bold text-stone-900">{t(titleKey)}</h1>
      {subtitleKey ? (
        <p className="mt-2 text-sm text-stone-600">{t(subtitleKey)}</p>
      ) : null}
    </header>
  );
}
