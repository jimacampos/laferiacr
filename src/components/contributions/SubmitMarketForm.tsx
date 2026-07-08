"use client";

import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

import { MarketMap } from "@/components/MarketMap";
import { DAYS_OF_WEEK, type DayOfWeek, type Region } from "@/data/types";
import { useTranslation } from "@/i18n/I18nProvider";
import {
  checkDuplicates,
  submitMarketSubmission,
  type DuplicateCandidate,
  type SubmissionInput,
} from "@/lib/contributions/api";
import type { LocationValue } from "@/lib/contributions/types";

const ENTRA_PROVIDER = "microsoft-entra-id";

function DuplicateWarning({
  duplicates,
}: {
  duplicates: DuplicateCandidate[];
}) {
  const { t } = useTranslation();
  if (duplicates.length === 0) return null;
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-semibold text-amber-800">
        {t("duplicates.warningTitle")}
      </p>
      <p className="mt-1 text-xs text-amber-700">{t("duplicates.warningBody")}</p>
      <ul className="mt-2 flex flex-col gap-1">
        {duplicates.map((d) => (
          <li key={d.slug} className="text-sm text-amber-900">
            <Link
              href={`/market/${d.slug}`}
              target="_blank"
              className="font-medium underline underline-offset-2"
            >
              {d.name}
            </Link>
            {d.regionName ? (
              <span className="text-amber-700"> · {d.regionName}</span>
            ) : null}
            {d.distanceMeters !== null ? (
              <span className="text-amber-700">
                {" "}
                · {t("duplicates.near", { meters: String(d.distanceMeters) })}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * New-market submission form (Phase 5, ADR-0009). Sign-in required. Runs a live soft duplicate
 * check as the user types the name (and after dropping a pin); duplicates are shown but never
 * block. On success the market enters the pending queue for community confirmation.
 */
export function SubmitMarketForm({ regions }: { regions: Region[] }) {
  const { t, dayName } = useTranslation();
  const { data: session, status } = useSession();

  const [name, setName] = useState("");
  const [regionId, setRegionId] = useState("");
  const [days, setDays] = useState<Set<DayOfWeek>>(new Set());
  const [hours, setHours] = useState("");
  const [reference, setReference] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [phone, setPhone] = useState("");
  const [picked, setPicked] = useState<LocationValue | null>(null);
  const [showMap, setShowMap] = useState(false);

  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live soft-duplicate check, debounced on name/pin changes.
  useEffect(() => {
    const trimmed = name.trim();
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      if (trimmed.length < 3) {
        setDuplicates([]);
        return;
      }
      const found = await checkDuplicates(trimmed, picked);
      setDuplicates(found);
    }, 400);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [name, picked]);

  function toggleDay(day: DayOfWeek) {
    setDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  function useMyLocation() {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setPicked({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const orderedDays = DAYS_OF_WEEK.filter((d) => days.has(d));
    if (name.trim().length === 0 || !regionId || orderedDays.length === 0) {
      setError(t("submitMarket.required"));
      return;
    }
    const region = regions.find((r) => r.id === regionId);
    if (!region) {
      setError(t("submitMarket.required"));
      return;
    }

    const input: SubmissionInput = {
      name: name.trim(),
      regionId: region.id,
      regionName: region.name,
      days: orderedDays,
      daysLabel: orderedDays.map((d) => dayName(d, "long")).join(", "),
      hoursText: hours.trim() || null,
      referenceText: reference.trim() || null,
      mapUrl: mapUrl.trim() || null,
      organizer: organizer.trim() || null,
      phones: phone.trim() ? [phone.trim()] : [],
      location: picked,
    };

    setBusy(true);
    const res = await submitMarketSubmission(input);
    setBusy(false);

    if (!res.ok) {
      setError(res.status === 429 ? t("submitMarket.rateLimited") : t("submitMarket.error"));
      return;
    }
    setDuplicates(res.data?.duplicates ?? []);
    setDone(true);
  }

  if (status === "loading") {
    return <p className="text-sm text-stone-500">{t("auth.loading")}</p>;
  }

  if (!session?.user) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center">
        <p className="text-sm text-stone-600">{t("submitMarket.signInRequired")}</p>
        <button
          type="button"
          onClick={() => signIn(ENTRA_PROVIDER)}
          className="mt-3 inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          {t("auth.signIn")}
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <p className="text-sm font-medium text-emerald-800">
            {t("submitMarket.success")}
          </p>
          <Link
            href="/markets/pending"
            className="mt-3 inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            {t("submitMarket.viewPending")}
          </Link>
        </div>
        <DuplicateWarning duplicates={duplicates} />
      </div>
    );
  }

  const labelClass = "text-sm font-medium text-stone-700";
  const inputClass =
    "rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <DuplicateWarning duplicates={duplicates} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="sm-name" className={labelClass}>
          {t("submitMarket.name")} *
        </label>
        <input
          id="sm-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("submitMarket.namePlaceholder")}
          maxLength={120}
          required
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="sm-region" className={labelClass}>
          {t("submitMarket.region")} *
        </label>
        <select
          id="sm-region"
          value={regionId}
          onChange={(e) => setRegionId(e.target.value)}
          required
          className={inputClass}
        >
          <option value="">{t("submitMarket.regionPlaceholder")}</option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={labelClass}>{t("submitMarket.days")} *</span>
        <div className="flex flex-wrap gap-2">
          {DAYS_OF_WEEK.map((day) => {
            const active = days.has(day);
            return (
              <button
                key={day}
                type="button"
                aria-pressed={active}
                onClick={() => toggleDay(day)}
                className={
                  "rounded-full px-3 py-1.5 text-sm font-medium transition " +
                  (active
                    ? "bg-emerald-600 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200")
                }
              >
                {dayName(day, "long")}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="sm-hours" className={labelClass}>
          {t("submitMarket.hours")}
        </label>
        <input
          id="sm-hours"
          type="text"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          placeholder={t("submitMarket.hoursPlaceholder")}
          maxLength={120}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="sm-ref" className={labelClass}>
          {t("submitMarket.reference")}
        </label>
        <input
          id="sm-ref"
          type="text"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder={t("submitMarket.referencePlaceholder")}
          maxLength={200}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="sm-map" className={labelClass}>
          {t("submitMarket.mapUrl")}
        </label>
        <input
          id="sm-map"
          type="url"
          value={mapUrl}
          onChange={(e) => setMapUrl(e.target.value)}
          placeholder={t("submitMarket.mapUrlPlaceholder")}
          maxLength={500}
          className={inputClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sm-org" className={labelClass}>
            {t("submitMarket.organizer")}
          </label>
          <input
            id="sm-org"
            type="text"
            value={organizer}
            onChange={(e) => setOrganizer(e.target.value)}
            maxLength={120}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sm-phone" className={labelClass}>
            {t("submitMarket.phone")}
          </label>
          <input
            id="sm-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={40}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className={labelClass}>{t("submitMarket.location")}</span>
        {showMap ? (
          <>
            <p className="text-xs text-stone-500">{t("submitMarket.pickOnMap")}</p>
            <MarketMap
              editable
              location={null}
              picked={picked}
              name={name || t("submitMarket.location")}
              onPick={(loc) => setPicked(loc)}
            />
            {picked && (
              <p className="text-xs font-medium text-emerald-700">
                {t("submitMarket.locationSelected")}
              </p>
            )}
            <button
              type="button"
              onClick={useMyLocation}
              className="inline-flex w-fit items-center rounded-full bg-stone-100 px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-200"
            >
              {t("submitMarket.useMyLocation")}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setShowMap(true)}
            className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-emerald-700 underline-offset-2 hover:underline"
          >
            {t("submitMarket.pickOnMap")}
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy ? t("submitMarket.submitting") : t("submitMarket.submit")}
        </button>
      </div>
    </form>
  );
}
