"use client";

import { useState } from "react";

import { useTranslation } from "@/i18n/I18nProvider";
import { submitProposal } from "@/lib/contributions/api";
import { HOURS_MAX_LENGTH } from "@/lib/contributions/config";

/** Anonymous "suggest hours" form: free-text hours proposal for a market. */
export function SuggestHours({
  slug,
  onSubmitted,
}: {
  slug: string;
  onSubmitted: () => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    const res = await submitProposal(slug, "hours", trimmed);
    setBusy(false);
    if (!res.ok) {
      setError(res.status === 429 ? t("contribute.rateLimited") : t("contribute.error"));
      return;
    }
    setDone(true);
    setValue("");
    setOpen(false);
    onSubmitted();
  }

  if (done) {
    return <p className="mt-3 text-sm text-emerald-700">{t("contribute.thanks")}</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 underline-offset-2 hover:underline"
      >
        {t("contribute.suggestHours")}
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-3 flex flex-col gap-2">
      <label className="text-sm font-medium text-stone-700">
        {t("contribute.editHours")}
      </label>
      <input
        type="text"
        value={value}
        maxLength={HOURS_MAX_LENGTH}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t("contribute.hoursPlaceholder")}
        autoFocus
        className="rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />
      <p className="text-xs text-stone-400">{t("contribute.hint")}</p>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={busy || value.trim().length === 0}
          className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy ? t("contribute.submitting") : t("contribute.submit")}
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
