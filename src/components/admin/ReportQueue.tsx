"use client";

import Link from "next/link";
import { useState } from "react";

import { useTranslation } from "@/i18n/I18nProvider";
import {
  removeProposal,
  resolveReports,
  type QueueItem,
} from "@/lib/contributions/adminApi";

function QueueRow({
  item,
  onDone,
}: {
  item: QueueItem;
  onDone: (targetId: string) => void;
}) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const countLabel =
    item.openReports <= 1
      ? t("moderation.queue.openReportsOne")
      : t("moderation.queue.openReports", { count: String(item.openReports) });

  const typeLabel =
    item.targetType === "market"
      ? t("moderation.queue.market")
      : t("moderation.queue.proposal");

  const title =
    item.targetType === "market"
      ? (item.marketName ?? item.targetId)
      : `${item.marketName ?? ""} · ${item.proposalField ?? ""}`.trim();

  async function act(fn: () => Promise<{ ok: boolean }>) {
    setBusy(true);
    setError(null);
    const res = await fn();
    setBusy(false);
    if (!res.ok) {
      setError(t("moderation.error"));
      return;
    }
    onDone(`${item.targetType}:${item.targetId}`);
  }

  const trimmedReason = reason.trim() || undefined;

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
              {typeLabel}
            </span>
            <span className="text-sm font-semibold text-stone-900">{title}</span>
          </div>
          <p className="mt-1 text-xs font-medium text-amber-700">{countLabel}</p>
          <p className="mt-1 text-sm text-stone-600">
            <span className="text-stone-400">
              {t("moderation.queue.latestReason")}:
            </span>{" "}
            {item.latestReason ?? t("moderation.queue.noReason")}
          </p>
        </div>
        {item.marketSlug && (
          <Link
            href={`/market/${item.marketSlug}`}
            className="shrink-0 text-sm font-medium text-emerald-700 hover:underline"
          >
            {t("moderation.queue.view")}
          </Link>
        )}
      </div>

      <input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder={t("moderation.reasonPlaceholder")}
        maxLength={280}
        className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            act(() =>
              resolveReports(
                item.targetType,
                item.targetId,
                "resolve",
                trimmedReason,
              ),
            )
          }
          className="rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {t("moderation.action.resolve")}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            act(() =>
              resolveReports(
                item.targetType,
                item.targetId,
                "dismiss",
                trimmedReason,
              ),
            )
          }
          className="rounded-full bg-stone-100 px-3 py-1.5 text-sm font-medium text-stone-600 transition hover:bg-stone-200 disabled:opacity-50"
        >
          {t("moderation.action.dismiss")}
        </button>
        {item.targetType === "proposal" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => act(() => removeProposal(item.targetId, trimmedReason))}
            className="rounded-full bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
          >
            {t("moderation.action.remove")}
          </button>
        )}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </li>
  );
}

/** The moderation reports queue: open reports grouped by target, ranked by count. Resolving,
 * dismissing, or removing a target drops it from the list. */
export function ReportQueue({ initial }: { initial: QueueItem[] }) {
  const { t } = useTranslation();
  const [items, setItems] = useState(initial);

  function drop(key: string) {
    setItems((prev) =>
      prev.filter((i) => `${i.targetType}:${i.targetId}` !== key),
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-stone-900">
        {t("moderation.queue.title")}
      </h2>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-stone-200 bg-white p-6 text-center text-sm text-stone-500">
          {t("moderation.queue.empty")}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <QueueRow
              key={`${item.targetType}:${item.targetId}`}
              item={item}
              onDone={drop}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
