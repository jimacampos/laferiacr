"use client";

import { useState } from "react";

import type { DayOfWeek } from "@/data/types";
import { useTranslation } from "@/i18n/I18nProvider";
import {
  DEFAULT_FILTERS,
  hasActiveFilters,
  type DaySelection,
  type FeriaFilters,
} from "@/lib/filters";

interface FilterBarProps {
  filters: FeriaFilters;
  onChange: (filters: FeriaFilters) => void;
  availableDays: DayOfWeek[];
}

export function FilterBar({ filters, onChange, availableDays }: FilterBarProps) {
  const { t, dayName } = useTranslation();

  const dayActive = filters.day !== DEFAULT_FILTERS.day;
  // Day filtering is secondary (BL-025): keep it tucked away, but reveal it when a day is set.
  const [open, setOpen] = useState(dayActive);

  const dayOptions: { value: DaySelection; label: string }[] = [
    { value: "all", label: t("day.all") },
    { value: "weekend", label: t("day.weekend") },
    ...availableDays.map((day) => ({ value: day, label: dayName(day, "long") })),
  ];

  const activeLabel = dayOptions.find(
    (option) => option.value === filters.day,
  )?.label;

  return (
    <section className="rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="day-filter-panel"
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-4 text-stone-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="17" rx="2" />
            <path d="M3 9h18M8 2v4M16 2v4" />
          </svg>
          {t("filters.day")}
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className={
              "size-4 text-stone-400 transition-transform " +
              (open ? "rotate-180" : "")
            }
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {!open && dayActive && activeLabel && (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-100">
            {activeLabel}
          </span>
        )}

        {hasActiveFilters(filters) && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="ml-auto text-sm font-medium text-emerald-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            {t("filters.clear")}
          </button>
        )}
      </div>

      {open && (
        <div
          id="day-filter-panel"
          role="group"
          aria-label={t("filters.day")}
          className="mt-3 flex flex-wrap gap-2 border-t border-stone-100 pt-3"
        >
          {dayOptions.map((option) => {
            const active = filters.day === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ ...filters, day: option.value })}
                className={
                  "rounded-full px-3.5 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 " +
                  (active
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200")
                }
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
