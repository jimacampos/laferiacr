"use client";

import { useTranslation } from "@/i18n/I18nProvider";
import { marketCountKey } from "@/lib/home";

interface HeroProps {
  count: number;
  query: string;
  onQueryChange: (query: string) => void;
}

export function Hero({ count, query, onQueryChange }: HeroProps) {
  const { t } = useTranslation();

  return (
    <section
      aria-labelledby="hero-title"
      className="rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50 to-white p-5 shadow-sm sm:p-7"
    >
      <h1
        id="hero-title"
        className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl"
      >
        {t("hero.title")}
      </h1>
      <p className="mt-1.5 text-sm text-stone-600 sm:text-base">
        {t("hero.subtitle")}
      </p>

      <div className="relative mt-4">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-stone-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          id="hero-search"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          aria-label={t("hero.searchLabel")}
          placeholder={t("hero.searchPlaceholder")}
          autoComplete="off"
          className="w-full rounded-xl border border-stone-300 bg-white py-3 pl-11 pr-4 text-base text-stone-900 shadow-sm placeholder:text-stone-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
        />
      </div>

      <p className="mt-3 text-sm text-stone-500">
        {t(marketCountKey(count), { count })}
      </p>
    </section>
  );
}
