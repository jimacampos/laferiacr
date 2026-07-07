"use client";

import { useMemo, useState } from "react";

import { AlphaIndex } from "@/components/AlphaIndex";
import { EmptyState } from "@/components/EmptyState";
import { FilterBar } from "@/components/FilterBar";
import { Hero } from "@/components/Hero";
import { MarketList } from "@/components/MarketList";
import type { Feria } from "@/data/types";
import { useTranslation } from "@/i18n/I18nProvider";
import {
  countRegions,
  groupFeriasByLetter,
  presentLetters,
} from "@/lib/home";
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
  const regions = useMemo(() => countRegions(ferias), [ferias]);
  const results = useMemo(
    () => filterFerias(ferias, filters),
    [ferias, filters],
  );
  const present = useMemo(
    () => presentLetters(groupFeriasByLetter(results)),
    [results],
  );

  const countLabel =
    results.length === 1
      ? t("results.one", { count: results.length })
      : t("results.many", { count: results.length });

  const setQuery = (query: string) => setFilters({ ...filters, query });

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-5 sm:py-6">
      <Hero
        count={ferias.length}
        regions={regions}
        query={filters.query}
        onQueryChange={setQuery}
      />

      <FilterBar
        filters={filters}
        onChange={setFilters}
        availableDays={availableDays}
      />

      {results.length > 0 ? (
        <>
          <div className="sticky top-0 z-20 -mx-4 bg-stone-50/85 px-4 py-2 backdrop-blur">
            <AlphaIndex present={present} />
          </div>

          <div>
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold text-stone-800">
                {t("results.list")}
              </h2>
              <span className="shrink-0 text-sm text-stone-500">
                {countLabel}
              </span>
            </div>
            <MarketList ferias={results} query={filters.query} />
          </div>
        </>
      ) : (
        <EmptyState query={filters.query} onClear={() => setFilters(DEFAULT_FILTERS)} />
      )}
    </div>
  );
}
