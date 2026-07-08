"use client";

import Link from "next/link";

import { useTranslation } from "@/i18n/I18nProvider";

/** A Link whose label is resolved through i18n, usable from server components. */
export function TranslatedLink({
  href,
  labelKey,
  className,
}: {
  href: string;
  labelKey: string;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <Link href={href} className={className}>
      {t(labelKey)}
    </Link>
  );
}
