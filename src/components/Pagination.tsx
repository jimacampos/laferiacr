"use client";

import { useTranslation } from "@/i18n/I18nProvider";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/** Simple numbered pager (‹ 1 2 3 … ›) for the market directory. Hidden for a single page. */
export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const { t } = useTranslation();

  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const go = (next: number) =>
    onPageChange(Math.min(Math.max(next, 1), totalPages));

  const arrowClass =
    "flex size-9 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 transition hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <nav
      aria-label={t("pager.label")}
      className="flex flex-wrap items-center justify-center gap-1.5"
    >
      <button
        type="button"
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        aria-label={t("pager.prev")}
        className={arrowClass}
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
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      {pages.map((value) => {
        const current = value === page;
        return (
          <button
            key={value}
            type="button"
            onClick={() => go(value)}
            aria-label={t("pager.goToPage", { page: value })}
            aria-current={current ? "page" : undefined}
            className={
              "flex size-9 items-center justify-center rounded-lg text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 " +
              (current
                ? "bg-emerald-700 text-white shadow-sm"
                : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50")
            }
          >
            {value}
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => go(page + 1)}
        disabled={page >= totalPages}
        aria-label={t("pager.next")}
        className={arrowClass}
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
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
    </nav>
  );
}
