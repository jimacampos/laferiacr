"use client";

import Link from "next/link";

import { useTranslation } from "@/i18n/I18nProvider";
import type { AttentionMarket } from "@/lib/contributions/attentionQueue";

function useFieldLabel() {
  const { t } = useTranslation();
  return (field: string): string => {
    if (field === "hours") return t("detail.hours");
    if (field === "location") return t("detail.location");
    return field;
  };
}

function MarketCard({
  market,
  threshold,
  formatDate,
}: {
  market: AttentionMarket;
  threshold: number;
  formatDate: (iso: string) => string;
}) {
  const { t } = useTranslation();
  const fieldLabel = useFieldLabel();

  const count = market.suggestions.length;
  const countLabel =
    count <= 1
      ? t("attention.suggestionsOne")
      : t("attention.suggestions", { count: String(count) });

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-stone-900">{market.name}</h3>
          <p className="mt-1 text-xs font-medium text-amber-700">{countLabel}</p>
        </div>
        <Link
          href={`/market/${market.slug}`}
          className="shrink-0 text-sm font-medium text-emerald-700 hover:underline"
        >
          {t("attention.review")}
        </Link>
      </div>

      <ul className="flex flex-col gap-2 border-t border-stone-100 pt-3">
        {market.suggestions.map((s) => (
          <li
            key={s.proposalId}
            className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
          >
            <span className="inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
              {fieldLabel(s.field)}
            </span>
            <span className="text-stone-700">
              {t("attention.progress", {
                net: String(s.net),
                threshold: String(threshold),
              })}
            </span>
            {s.remaining > 0 && (
              <span className="text-xs font-medium text-amber-700">
                {t("attention.needsMore", { remaining: String(s.remaining) })}
              </span>
            )}
            <span className="text-xs text-stone-400">
              {t("attention.waitingSince", { date: formatDate(s.createdAt) })}
            </span>
          </li>
        ))}
      </ul>
    </li>
  );
}

/** The confirmation backlog: markets whose pending suggested changes still need more
 * confirmations to verify, oldest/most-stale first. Read-only — each row links to the
 * market page, where the confirm UI and inline moderation controls live. */
export function AttentionQueue({
  markets,
  threshold,
}: {
  markets: AttentionMarket[];
  threshold: number;
}) {
  const { t, lang } = useTranslation();
  const fmt = new Intl.DateTimeFormat(lang === "es" ? "es-CR" : "en-US", {
    dateStyle: "medium",
  });
  const formatDate = (iso: string) => fmt.format(new Date(iso));

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">
          {t("attention.title")}
        </h2>
        <p className="mt-1 text-sm text-stone-500">{t("attention.subtitle")}</p>
      </div>

      {markets.length === 0 ? (
        <p className="rounded-2xl border border-stone-200 bg-white p-6 text-center text-sm text-stone-500">
          {t("attention.empty")}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {markets.map((market) => (
            <MarketCard
              key={market.marketId}
              market={market}
              threshold={threshold}
              formatDate={formatDate}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
