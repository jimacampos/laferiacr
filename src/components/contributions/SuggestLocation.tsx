"use client";

import { useState } from "react";

import { MarketMap } from "@/components/MarketMap";
import { useTranslation } from "@/i18n/I18nProvider";
import { submitProposal } from "@/lib/contributions/api";
import type { MarketLocation } from "@/lib/markets";

/**
 * Anonymous "suggest location" form: tap the map to drop a pin, or use the browser's
 * geolocation (with explicit consent copy) to place it, then submit a location proposal.
 */
export function SuggestLocation({
  slug,
  name,
  current,
  onSubmitted,
}: {
  slug: string;
  name: string;
  current: MarketLocation | null;
  onSubmitted: () => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<MarketLocation | null>(null);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setError(t("contribute.geoDenied"));
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setPicked({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setLocating(false);
        setError(t("contribute.geoDenied"));
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function submit() {
    if (!picked) return;
    setBusy(true);
    setError(null);
    const res = await submitProposal(slug, "location", picked);
    setBusy(false);
    if (!res.ok) {
      setError(res.status === 429 ? t("contribute.rateLimited") : t("contribute.error"));
      return;
    }
    setDone(true);
    setPicked(null);
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
        {t("contribute.suggestLocation")}
      </button>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <p className="text-sm font-medium text-stone-700">
        {t("contribute.editLocation")}
      </p>
      <p className="text-xs text-stone-500">{t("contribute.pickOnMap")}</p>
      <MarketMap
        editable
        location={current}
        picked={picked}
        name={name}
        onPick={(loc) => setPicked(loc)}
      />
      <p className="text-xs text-stone-400">{t("contribute.geoConsent")}</p>
      {picked && (
        <p className="text-xs font-medium text-emerald-700">
          {t("contribute.locationSelected")}
        </p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="inline-flex items-center rounded-full bg-stone-100 px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-200 disabled:opacity-50"
        >
          {locating ? t("contribute.locating") : t("contribute.useMyLocation")}
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={busy || !picked}
          className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy ? t("contribute.submitting") : t("contribute.submit")}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setPicked(null);
            setError(null);
          }}
          className="text-sm font-medium text-stone-500 hover:text-stone-700"
        >
          {t("contribute.cancel")}
        </button>
      </div>
    </div>
  );
}
