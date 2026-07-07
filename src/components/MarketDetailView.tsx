"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { AdminControls } from "@/components/admin/AdminControls";
import { ContributionBadge } from "@/components/contributions/ContributionBadge";
import { ProposalList } from "@/components/contributions/ProposalList";
import { ReportButton } from "@/components/contributions/ReportButton";
import { SuggestHours } from "@/components/contributions/SuggestHours";
import { SuggestLocation } from "@/components/contributions/SuggestLocation";
import { DayBadges } from "@/components/DayBadges";
import { MarketMap } from "@/components/MarketMap";
import { useTranslation } from "@/i18n/I18nProvider";
import type { MarketContributions } from "@/lib/contributions/types";
import { phoneToTelHref } from "@/lib/filters";
import type { MarketDetail } from "@/lib/markets";

function PinIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

export interface MarketViewer {
  isModerator: boolean;
  isSuperAdmin: boolean;
}

export function MarketDetailView({
  market,
  contributions,
  viewer,
}: {
  market: MarketDetail;
  contributions: MarketContributions;
  viewer?: MarketViewer;
}) {
  const { t, lang } = useTranslation();
  const router = useRouter();

  // Contributions only apply to DB-backed markets (the static fallback has no dbId).
  const canContribute = Boolean(market.dbId);
  const canModerate = Boolean(viewer?.isModerator && market.dbId);
  const refresh = () => router.refresh();

  const updated = new Date(market.updatedAt).toLocaleDateString(
    lang === "es" ? "es-CR" : "en-US",
    { year: "numeric", month: "long", day: "numeric" },
  );
  const provenance =
    market.source === "community"
      ? t("detail.provenance.community")
      : t("detail.provenance.official");

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 sm:py-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 transition hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        {t("detail.back")}
      </Link>

      <article className="mt-4 flex flex-col gap-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-stone-900 sm:text-2xl">
            {market.name}
          </h1>
          {market.regionName && (
            <p className="flex items-center gap-1.5 text-sm text-stone-500">
              <PinIcon />
              {market.regionName}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800 ring-1 ring-emerald-200">
              {provenance}
            </span>
            <span className="text-stone-400">
              {t("detail.updated", { date: updated })}
            </span>
          </div>
        </header>

        {canModerate && (
          <AdminControls
            slug={market.id}
            hidden={market.status === "hidden"}
            isSuperAdmin={Boolean(viewer?.isSuperAdmin)}
            onChanged={refresh}
          />
        )}

        <section className="border-t border-stone-100 pt-4">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <h2 className="text-xs font-medium uppercase tracking-wide text-stone-400">
              {t("detail.hours")}
            </h2>
            {market.hoursText && contributions.hours.verified && (
              <ContributionBadge
                verified
                confirmCount={contributions.hours.verifiedConfirmCount}
                verifiedAt={contributions.hours.verifiedAt}
              />
            )}
          </div>
          {market.hoursText ? (
            <p className="text-sm text-stone-800">{market.hoursText}</p>
          ) : (
            <p className="text-sm italic text-stone-400">
              {t("detail.hoursUnknown")}
            </p>
          )}
          {canContribute && (
            <>
              <ProposalList
                proposals={contributions.hours.pending}
                field="hours"
                name={market.name}
                onChanged={refresh}
                canModerate={canModerate}
              />
              <SuggestHours slug={market.id} onSubmitted={refresh} />
            </>
          )}
        </section>

        <section className="border-t border-stone-100 pt-4">
          <h2 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-stone-400">
            {t("card.days")}
          </h2>
          <DayBadges days={market.days} />
        </section>

        <section id="location" className="border-t border-stone-100 pt-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h2 className="text-xs font-medium uppercase tracking-wide text-stone-400">
              {t("detail.location")}
            </h2>
            {market.location && contributions.location.verified && (
              <ContributionBadge
                verified
                confirmCount={contributions.location.verifiedConfirmCount}
                verifiedAt={contributions.location.verifiedAt}
              />
            )}
          </div>
          <MarketMap location={market.location} name={market.name} />
          {!market.location && (
            <p className="mt-2 text-sm italic text-stone-400">
              {t("detail.locationUnknown")}
            </p>
          )}
          {canContribute && (
            <>
              <ProposalList
                proposals={contributions.location.pending}
                field="location"
                name={market.name}
                onChanged={refresh}
                canModerate={canModerate}
              />
              <SuggestLocation
                slug={market.id}
                name={market.name}
                current={market.location}
                onSubmitted={refresh}
              />
            </>
          )}
        </section>

        {market.organizer && (
          <section className="border-t border-stone-100 pt-4">
            <h2 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-stone-400">
              {t("card.organizer")}
            </h2>
            <p className="text-sm text-stone-800">{market.organizer}</p>
          </section>
        )}

        {market.phones.length > 0 && (
          <section className="border-t border-stone-100 pt-4">
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">
              {t("detail.phones")}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              {market.phones.map((phone) => (
                <a
                  key={phone}
                  href={phoneToTelHref(phone)}
                  aria-label={t("card.call", { name: market.name })}
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                >
                  <PhoneIcon />
                  {phone}
                </a>
              ))}
            </div>
          </section>
        )}

        {canContribute && (
          <section className="border-t border-stone-100 pt-4">
            <ReportButton slug={market.id} />
          </section>
        )}
      </article>
    </div>
  );
}
