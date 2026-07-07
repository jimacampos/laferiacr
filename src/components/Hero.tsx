"use client";

import { useEffect, useRef } from "react";

import { useTranslation } from "@/i18n/I18nProvider";
import { BrandMark } from "./BrandMark";

interface HeroProps {
  count: number;
  regions: number;
  query: string;
  onQueryChange: (query: string) => void;
}

export function Hero({ count, regions, query, onQueryChange }: HeroProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  // "/" focuses search from anywhere on the page (unless the user is already typing).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) {
        return;
      }
      event.preventDefault();
      inputRef.current?.focus();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-amber-50/60 p-6 shadow-sm sm:p-8"
    >
      {/* decorative produce motif, purely ornamental */}
      <BrandMark className="pointer-events-none absolute -right-6 -top-6 size-40 text-emerald-600/10" />
      <BrandMark className="pointer-events-none absolute -bottom-10 right-24 size-24 text-amber-500/10" />

      <div className="relative">
        <div className="flex items-center gap-2 text-emerald-700">
          <BrandMark className="size-6" />
          <span className="text-sm font-semibold uppercase tracking-wide">
            {t("app.title")}
          </span>
        </div>

        <h1
          id="hero-title"
          className="mt-3 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl"
        >
          {t("hero.title")}
        </h1>
        <p className="mt-2 max-w-xl text-base text-stone-600">
          {t("hero.subtitle")}
        </p>

        <div className="relative mt-5 max-w-xl">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-stone-400"
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
            ref={inputRef}
            id="hero-search"
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            aria-label={t("hero.searchLabel")}
            placeholder={t("hero.searchPlaceholder")}
            autoComplete="off"
            className="w-full rounded-2xl border border-stone-300 bg-white py-3.5 pl-12 pr-24 text-base text-stone-900 shadow-sm placeholder:text-stone-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 sm:[&::-webkit-search-cancel-button]:appearance-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                onQueryChange("");
                inputRef.current?.focus();
              }}
              aria-label={t("search.clear")}
              className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-stone-500 transition hover:bg-stone-100 hover:text-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <kbd
              aria-hidden="true"
              className="pointer-events-none absolute right-3.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-stone-200 bg-stone-50 px-2 py-0.5 text-xs font-medium text-stone-400 sm:block"
            >
              /
            </kbd>
          )}
        </div>

        <p className="mt-4 flex flex-wrap items-center gap-x-1.5 text-sm text-stone-500">
          <span
            aria-hidden="true"
            className="inline-block size-2 rounded-full bg-emerald-500"
          />
          {t("hero.stats", { markets: count, regions })}
        </p>
      </div>
    </section>
  );
}
