"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { MarketMap } from "@/components/MarketMap";
import { useTranslation } from "@/i18n/I18nProvider";
import { approveProposal } from "@/lib/contributions/adminApi";
import type {
  AttentionMarket,
  PendingSuggestion,
} from "@/lib/contributions/attentionQueue";

function useFieldLabel() {
  const { t } = useTranslation();
  return (field: string): string => {
    if (field === "hours") return t("detail.hours");
    if (field === "location") return t("detail.location");
    return field;
  };
}

function isLocation(
  value: PendingSuggestion["value"],
): value is { lat: number; lng: number } {
  return typeof value === "object" && value !== null && "lat" in value;
}

function ProposedValue({
  suggestion,
  name,
}: {
  suggestion: PendingSuggestion;
  name: string;
}) {
  const { t } = useTranslation();
  if (suggestion.field === "location" && isLocation(suggestion.value)) {
    const { lat, lng } = suggestion.value;
    return (
      <div className="flex flex-col gap-1.5">
        <MarketMap location={{ lat, lng }} name={name} />
        <a
          href={`https://www.google.com/maps?q=${lat},${lng}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-medium text-emerald-700 underline-offset-2 hover:underline"
        >
          {t("attention.viewOnMap")}
        </a>
      </div>
    );
  }
  return (
    <p className="text-sm font-medium text-stone-800">
      {String(suggestion.value)}
    </p>
  );
}

function SuggestionRow({
  suggestion,
  name,
  threshold,
  canApprove,
  formatDate,
}: {
  suggestion: PendingSuggestion;
  name: string;
  threshold: number;
  canApprove: boolean;
  formatDate: (iso: string) => string;
}) {
  const { t } = useTranslation();
  const fieldLabel = useFieldLabel();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [approved, setApproved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function approve() {
    setBusy(true);
    setError(null);
    const res = await approveProposal(suggestion.proposalId);
    if (!res.ok) {
      setBusy(false);
      setError(t("attention.approveError"));
      return;
    }
    setApproved(true);
    router.refresh();
  }

  return (
    <li className="flex flex-col gap-2 border-t border-stone-100 pt-3 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
          {fieldLabel(suggestion.field)}
        </span>
        <span className="text-stone-700">
          {t("attention.progress", {
            net: String(suggestion.net),
            threshold: String(threshold),
          })}
        </span>
        {suggestion.remaining > 0 && (
          <span className="text-xs font-medium text-amber-700">
            {t("attention.needsMore", {
              remaining: String(suggestion.remaining),
            })}
          </span>
        )}
        <span className="text-xs text-stone-400">
          {t("attention.waitingSince", {
            date: formatDate(suggestion.createdAt),
          })}
        </span>
      </div>

      <ProposedValue suggestion={suggestion} name={name} />

      {canApprove &&
        (approved ? (
          <p className="text-sm font-medium text-emerald-700">
            {t("attention.approved")}
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            <div>
              <button
                type="button"
                disabled={busy}
                onClick={approve}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {busy ? t("attention.approving") : t("attention.approve")}
              </button>
            </div>
            <p className="text-xs text-stone-400">{t("attention.approveHint")}</p>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
        ))}
    </li>
  );
}

function MarketCard({
  market,
  threshold,
  canApprove,
  formatDate,
}: {
  market: AttentionMarket;
  threshold: number;
  canApprove: boolean;
  formatDate: (iso: string) => string;
}) {
  const { t } = useTranslation();

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

      <ul className="flex flex-col gap-3 border-t border-stone-100 pt-3">
        {market.suggestions.map((s) => (
          <SuggestionRow
            key={s.proposalId}
            suggestion={s}
            name={market.name}
            threshold={threshold}
            canApprove={canApprove}
            formatDate={formatDate}
          />
        ))}
      </ul>
    </li>
  );
}

/** The confirmation backlog: markets whose pending suggested changes still need more
 * confirmations to verify, oldest/most-stale first. Each suggestion shows its proposed value;
 * a super_admin can approve (break-glass promote) a suggestion in place. */
export function AttentionQueue({
  markets,
  threshold,
  canApprove = false,
}: {
  markets: AttentionMarket[];
  threshold: number;
  canApprove?: boolean;
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
              canApprove={canApprove}
              formatDate={formatDate}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
