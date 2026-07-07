"use client";

import { useMemo, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { FilterBar } from "@/components/FilterBar";
import { Hero } from "@/components/Hero";
import { MarketList } from "@/components/MarketList";
import type { Feria } from "@/data/types";
import { useTranslation } from "@/i18n/I18nProvider";
import {
  DEFAULT_FILTERS,
  filterFerias,
  getAvailableDays,
  type FeriaFilters,
} from "@/lib/filters";

interface HomeClientProps {
  ferias: Feria[];
}

export function HomeClient({ ferias }: HomeClientProps) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<FeriaFilters>(DEFAULT_FILTERS);

  const availableDays = useMemo(() => getAvailableDays(ferias), [ferias]);
  const results = useMemo(
    () => filterFerias(ferias, filters),
    [ferias, filters],
  );

  const countLabel =
    results.length === 1
      ? t("results.one", { count: results.length })
      : t("results.many", { count: results.length });

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-5 sm:py-6">
      <Hero
        count={ferias.length}
        query={filters.query}
        onQueryChange={(query) => setFilters({ ...filters, query })}
      />

      <FilterBar
        filters={filters}
        onChange={setFilters}
        availableDays={availableDays}
      />

      <div>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold text-stone-800">
            {t("results.list")}
          </h2>
          <span className="shrink-0 text-sm text-stone-500">{countLabel}</span>
        </div>

        {results.length > 0 ? (
          <MarketList ferias={results} />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}
