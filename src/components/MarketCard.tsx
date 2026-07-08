"use client";

import Link from "next/link";

import type { Feria } from "@/data/types";
import { useTranslation } from "@/i18n/I18nProvider";
import { feriaHasLocation, marketMapHref } from "@/lib/home";
import { highlightSegments } from "@/lib/search";
import { DayBadges } from "./DayBadges";

export function MarketCard({ feria, query = "" }: { feria: Feria; query?: string }) {
  const { t } = useTranslation();
  const segments = highlightSegments(feria.name, query);

  return (
    <article className="group relative flex h-full flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition duration-150 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md focus-within:ring-2 focus-within:ring-emerald-500">
      <h3 className="text-lg font-bold text-stone-900 sm:text-xl">
        <Link
          href={`/market/${feria.id}`}
          className="transition after:absolute after:inset-0 group-hover:text-emerald-700 focus-visible:outline-none"
        >
          {segments.map((segment, index) =>
            segment.match ? (
              <mark
                key={index}
                className="rounded bg-emerald-100 text-emerald-900"
              >
                {segment.text}
              </mark>
            ) : (
              <span key={index}>{segment.text}</span>
            ),
          )}
        </Link>
      </h3>

      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-stone-400">
          {t("card.days")}
        </p>
        <DayBadges days={feria.days} />
      </div>

      {feria.source === "community" && (
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 ring-1 ring-sky-200">
          {t("provenance.communityShort")}
        </span>
      )}

      {feriaHasLocation(feria) && (
        <div className="mt-auto pt-1">
          <Link
            href={marketMapHref(feria)}
            aria-label={t("card.viewMap", { name: feria.name })}
            className="relative z-10 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {t("card.location")}
          </Link>
        </div>
      )}
    </article>
  );
}
