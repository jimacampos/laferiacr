"use client";

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

  const dayOptions: { value: DaySelection; label: string }[] = [
    { value: "all", label: t("day.all") },
    { value: "weekend", label: t("day.weekend") },
    ...availableDays.map((day) => ({ value: day, label: dayName(day, "long") })),
  ];

  return (
    <section
      aria-label={t("filters.day")}
      className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
    >
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">
        {t("filters.day")}
      </p>
      <div
        role="group"
        aria-label={t("filters.day")}
        className="flex flex-wrap gap-2"
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

      {hasActiveFilters(filters) && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="text-sm font-medium text-emerald-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            {t("filters.clear")}
          </button>
        </div>
      )}
    </section>
  );
}
