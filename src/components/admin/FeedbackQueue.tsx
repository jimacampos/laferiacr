"use client";

import Link from "next/link";
import { useState } from "react";

import { useTranslation } from "@/i18n/I18nProvider";
import {
  listFeedback,
  setFeedbackStatus,
  type FeedbackRow,
} from "@/lib/contributions/adminApi";

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const styles: Record<string, string> = {
    open: "bg-amber-50 text-amber-800 ring-amber-200",
    reviewed: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    archived: "bg-stone-100 text-stone-600 ring-stone-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
        styles[status] ?? styles.archived
      }`}
    >
      {t(`feedbackAdmin.status.${status}`)}
    </span>
  );
}

function Row({
  item,
  onChange,
}: {
  item: FeedbackRow;
  onChange: (id: string, status: string) => void;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const author =
    item.author.displayName ||
    item.author.email ||
    t("feedbackAdmin.unknownAuthor");
  const when = new Date(item.createdAt).toLocaleString();

  async function update(status: "reviewed" | "open" | "archived") {
    setBusy(true);
    setError(null);
    const res = await setFeedbackStatus(item.id, status);
    setBusy(false);
    if (!res.ok) {
      setError(t("feedbackAdmin.error"));
      return;
    }
    onChange(item.id, status);
  }

  return (
    <li className="flex flex-col gap-2 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-stone-500">
          <StatusBadge status={item.status} />
          <span className="font-medium text-stone-700">{author}</span>
          <span>· {when}</span>
        </div>
        {item.pageUrl ? (
          <Link
            href={item.pageUrl}
            className="text-xs font-medium text-emerald-700 underline-offset-2 hover:underline"
          >
            {item.pageUrl}
          </Link>
        ) : null}
      </div>
      <p className="whitespace-pre-line text-sm text-stone-800">{item.message}</p>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex items-center gap-2">
        {item.status !== "reviewed" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => update("reviewed")}
            className="inline-flex items-center rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {t("feedbackAdmin.markReviewed")}
          </button>
        )}
        {item.status !== "open" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => update("open")}
            className="text-xs font-medium text-stone-500 hover:text-stone-700"
          >
            {t("feedbackAdmin.reopen")}
          </button>
        )}
        {item.status !== "archived" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => update("archived")}
            className="text-xs font-medium text-stone-500 hover:text-stone-700"
          >
            {t("feedbackAdmin.archive")}
          </button>
        )}
      </div>
    </li>
  );
}

/** Admin list of user feedback with per-item status controls. */
export function FeedbackQueue({ initial }: { initial: FeedbackRow[] }) {
  const { t } = useTranslation();
  const [items, setItems] = useState(initial);

  async function refresh() {
    const res = await listFeedback();
    if (res.ok && res.data) setItems(res.data.queue);
  }

  function onChange(id: string, status: string) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, status } : it)),
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-stone-900">
          {t("feedbackAdmin.title")}
        </h2>
        <p className="rounded-2xl border border-stone-200 bg-white p-6 text-center text-sm text-stone-500">
          {t("feedbackAdmin.empty")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-900">
          {t("feedbackAdmin.title")}
        </h2>
        <button
          type="button"
          onClick={refresh}
          className="text-sm font-medium text-emerald-700 underline-offset-2 hover:underline"
        >
          {t("feedbackAdmin.refresh")}
        </button>
      </div>
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <Row key={item.id} item={item} onChange={onChange} />
        ))}
      </ul>
    </div>
  );
}
