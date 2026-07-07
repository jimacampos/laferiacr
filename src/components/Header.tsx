"use client";

import Link from "next/link";

import { useTranslation } from "@/i18n/I18nProvider";
import { AdminLink } from "./AdminLink";
import { AuthStatus } from "./AuthStatus";
import { BrandMark } from "./BrandMark";
import { LanguageToggle } from "./LanguageToggle";

export function Header() {
  const { t } = useTranslation();

  return (
    <header className="bg-emerald-700 text-white shadow-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:py-5">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/20">
            <BrandMark className="size-6" />
          </span>
          <div>
            <h1 className="text-lg font-bold leading-tight sm:text-xl">
              {t("app.title")}
            </h1>
            <p className="text-sm text-emerald-50/90">{t("app.tagline")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/help"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {t("nav.help")}
          </Link>
          <AdminLink />
          <LanguageToggle />
          <AuthStatus />
        </div>
      </div>
    </header>
  );
}
