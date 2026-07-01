"use client";

import { useState } from "react";

import { useTranslation } from "@/i18n/I18nProvider";
import { setConfigValue } from "@/lib/contributions/adminApi";

/** Super-Admin settings form. Currently the single admin-configurable policy value is the net
 * confirmation threshold N (ADR-0015); the DB value overrides the CONFIRMATION_THRESHOLD env. */
export function SettingsForm({
  thresholdKey,
  initialThreshold,
}: {
  thresholdKey: string;
  initialThreshold: number;
}) {
  const { t } = useTranslation();
  const [value, setValue] = useState(String(initialThreshold));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
      setError(t("settings.invalid"));
      return;
    }

    setBusy(true);
    const res = await setConfigValue(thresholdKey, String(parsed));
    setBusy(false);
    if (!res.ok) {
      setError(res.error === "invalid_value" ? t("settings.invalid") : t("settings.error"));
      return;
    }
    setMessage(t("settings.saved"));
  }

  return (
    <section className="flex max-w-md flex-col gap-4">
      <h2 className="text-lg font-semibold text-stone-900">{t("settings.title")}</h2>

      <form
        onSubmit={save}
        className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
      >
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-stone-700">
            {t("settings.threshold.label")}
          </span>
          <input
            type="number"
            min={1}
            step={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-28 rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <span className="text-xs text-stone-500">{t("settings.threshold.help")}</span>
        </label>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {busy ? t("settings.saving") : t("settings.save")}
          </button>
          {message && <span className="text-xs text-emerald-700">{message}</span>}
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
      </form>
    </section>
  );
}
