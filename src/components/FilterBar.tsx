"use client";

import type { DayOfWeek, Region } from "@/data/types";
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
  regions: Region[];
  availableDays: DayOfWeek[];
}

export function FilterBar({
  filters,
  onChange,
  regions,
  availableDays,
}: FilterBarProps) {
  const { t, dayName } = useTranslation();

  const dayOptions: { value: DaySelection; label: string }[] = [
    { value: "weekend", label: t("day.weekend") },
    { value: "all", label: t("day.all") },
    ...availableDays.map((day) => ({ value: day, label: dayName(day, "long") })),
  ];

  return (
    <section
      aria-label={t("filters.heading")}
      className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
    >
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

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor="region-filter"
            className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-400"
          >
            {t("filters.region")}
          </label>
          <select
            id="region-filter"
            value={filters.regionId}
            onChange={(event) =>
              onChange({ ...filters, regionId: event.target.value })
            }
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            <option value="all">{t("filters.allRegions")}</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="search-filter"
            className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-400"
          >
            {t("filters.search")}
          </label>
          <input
            id="search-filter"
            type="search"
            value={filters.query}
            onChange={(event) =>
              onChange({ ...filters, query: event.target.value })
            }
            placeholder={t("filters.searchPlaceholder")}
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          />
        </div>
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
