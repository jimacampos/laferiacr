"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { AlphaIndex } from "@/components/AlphaIndex";
import { EmptyState } from "@/components/EmptyState";
import { FilterBar } from "@/components/FilterBar";
import { Hero } from "@/components/Hero";
import { MarketList } from "@/components/MarketList";
import { Pagination } from "@/components/Pagination";
import type { Feria } from "@/data/types";
import { useTranslation } from "@/i18n/I18nProvider";
import {
  groupFeriasByLetter,
  letterFirstPage,
  letterSectionId,
  pageCount,
  paginate,
  presentLetters,
  sortFeriasByName,
} from "@/lib/home";
import {
  DEFAULT_FILTERS,
  filterFerias,
  getAvailableDays,
  type FeriaFilters,
} from "@/lib/filters";

const PER_PAGE = 10;

interface HomeClientProps {
  ferias: Feria[];
}

export function HomeClient({ ferias }: HomeClientProps) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<FeriaFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const pendingLetter = useRef<string | null>(null);

  const availableDays = useMemo(() => getAvailableDays(ferias), [ferias]);
  const sorted = useMemo(
    () => sortFeriasByName(filterFerias(ferias, filters)),
    [ferias, filters],
  );

  const present = useMemo(
    () => presentLetters(groupFeriasByLetter(sorted)),
    [sorted],
  );
  const letterPages = useMemo(() => letterFirstPage(sorted, PER_PAGE), [sorted]);

  const totalPages = pageCount(sorted.length, PER_PAGE);
  const currentPage = Math.min(page, Math.max(totalPages, 1));
  const pageItems = paginate(sorted, currentPage, PER_PAGE);

  // Changing the result set (new search or day filter) returns to the first page.
  const applyFilters = (next: FeriaFilters) => {
    setFilters(next);
    setPage(1);
  };

  // After an A–Z jump changes the page, scroll to the requested letter's section.
  useEffect(() => {
    const letter = pendingLetter.current;
    if (!letter) return;
    pendingLetter.current = null;
    document
      .getElementById(letterSectionId(letter))
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentPage]);

  const scrollToLetter = (letter: string) => {
    document
      .getElementById(letterSectionId(letter))
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleLetterSelect = (letter: string) => {
    const target = letterPages.get(letter);
    if (!target) return;
    if (target === currentPage) {
      scrollToLetter(letter);
    } else {
      pendingLetter.current = letter;
      setPage(target);
    }
  };

  const countLabel =
    sorted.length === 1
      ? t("results.one", { count: sorted.length })
      : t("results.many", { count: sorted.length });

  const setQuery = (query: string) => applyFilters({ ...filters, query });

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-5 sm:py-6">
      <Hero query={filters.query} onQueryChange={setQuery} />

      <FilterBar
        filters={filters}
        onChange={applyFilters}
        availableDays={availableDays}
      />

      {sorted.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold text-stone-800">
              {t("results.list")}
            </h2>
            <span className="shrink-0 text-sm text-stone-500">{countLabel}</span>
          </div>

          <MarketList ferias={pageItems} query={filters.query} />

          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
          />

          <div className="border-t border-stone-200 pt-5">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">
              {t("list.index")}
            </p>
            <AlphaIndex present={present} onSelect={handleLetterSelect} />
          </div>
        </div>
      ) : (
        <EmptyState
          query={filters.query}
          onClear={() => applyFilters(DEFAULT_FILTERS)}
        />
      )}
    </div>
  );
}
