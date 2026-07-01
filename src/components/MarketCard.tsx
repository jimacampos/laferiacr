"use client";

import Link from "next/link";

import type { Feria } from "@/data/types";
import { useTranslation } from "@/i18n/I18nProvider";
import { phoneToTelHref } from "@/lib/filters";
import { DayBadges } from "./DayBadges";

export function MarketCard({
  feria,
  regionName,
}: {
  feria: Feria;
  regionName?: string;
}) {
  const { t } = useTranslation();

  return (
    <article className="relative flex h-full flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:shadow-md focus-within:ring-2 focus-within:ring-emerald-500">
      <div>
        <h3 className="text-base font-bold text-stone-900 sm:text-lg">
          <Link
            href={`/market/${feria.id}`}
            className="transition after:absolute after:inset-0 hover:text-emerald-700 focus-visible:outline-none"
          >
            {feria.name}
          </Link>
        </h3>
        {regionName && (
          <p className="flex items-center gap-1 text-sm text-stone-500">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {regionName}
          </p>
        )}
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-stone-400">
          {t("card.days")}
        </p>
        <DayBadges days={feria.days} />
      </div>

      <div className="mt-1 space-y-2 border-t border-stone-100 pt-3 text-sm">
        {feria.administrator && (
          <p className="flex flex-wrap gap-x-1.5 text-stone-600">
            <span className="font-medium text-stone-500">
              {t("card.organizer")}:
            </span>
            <span>{feria.administrator}</span>
          </p>
        )}
        {feria.phones.length > 0 && (
          <div className="relative z-10 flex flex-wrap items-center gap-2 pt-0.5">
            {feria.phones.map((phone) => (
              <a
                key={phone}
                href={phoneToTelHref(phone)}
                aria-label={t("card.call", { name: feria.name })}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 font-medium text-emerald-700 transition hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
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
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
                </svg>
                {phone}
              </a>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
