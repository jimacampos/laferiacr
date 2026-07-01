"use client";

import { useState } from "react";

import { useTranslation } from "@/i18n/I18nProvider";
import { submitReport } from "@/lib/contributions/api";

/** Anonymous flag/report control for a market. Opens a small reason box on demand. */
export function ReportButton({ slug }: { slug: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await submitReport("market", slug, reason.trim() || undefined);
    setBusy(false);
    if (!res.ok) {
      setError(res.status === 429 ? t("contribute.rateLimited") : t("contribute.error"));
      return;
    }
    setDone(true);
    setOpen(false);
  }

  if (done) {
    return <p className="text-xs text-stone-400">{t("report.thanks")}</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-stone-400 underline-offset-2 hover:text-stone-600 hover:underline"
      >
        {t("report.button")}
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <label className="text-sm font-medium text-stone-700">
        {t("report.market")}
      </label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder={t("report.reasonPlaceholder")}
        rows={2}
        maxLength={280}
        className="rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center rounded-full bg-stone-700 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-50"
        >
          {busy ? t("contribute.submitting") : t("report.submit")}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="text-sm font-medium text-stone-500 hover:text-stone-700"
        >
          {t("contribute.cancel")}
        </button>
      </div>
    </form>
  );
}
