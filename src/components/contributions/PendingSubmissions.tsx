"use client";

import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useCallback, useState } from "react";

import { MarketMap } from "@/components/MarketMap";
import { useTranslation } from "@/i18n/I18nProvider";
import { submitReport, voteSubmission } from "@/lib/contributions/api";
import { removeSubmission } from "@/lib/contributions/adminApi";
import { voteErrorKey } from "@/lib/contributions/voteErrors";
import type { PendingSubmission } from "@/lib/contributions/submissionTypes";

const ENTRA_PROVIDER = "microsoft-entra-id";

function ReportSubmission({ id }: { id: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await submitReport("submission", id, reason.trim() || undefined);
    setBusy(false);
    if (res.ok) setDone(true);
  }

  if (done) return <p className="text-xs text-stone-400">{t("report.thanks")}</p>;
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
    <form onSubmit={submit} className="mt-2 flex flex-col gap-2">
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder={t("report.reasonPlaceholder")}
        rows={2}
        maxLength={280}
        className="rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />
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
          onClick={() => setOpen(false)}
          className="text-sm font-medium text-stone-500 hover:text-stone-700"
        >
          {t("contribute.cancel")}
        </button>
      </div>
    </form>
  );
}

/** One pending community submission with its details, tally, and confirm/reject controls. */
export function SubmissionCard({
  submission,
  canModerate = false,
  onChanged,
}: {
  submission: PendingSubmission;
  canModerate?: boolean;
  onChanged?: () => void;
}) {
  const { t, dayName } = useTranslation();
  const { data: session, status } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promotedSlug, setPromotedSlug] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);

  const signedIn = Boolean(session?.user);

  async function vote(kind: "confirm" | "reject") {
    setBusy(true);
    setError(null);
    const res = await voteSubmission(submission.id, kind);
    setBusy(false);
    if (!res.ok) {
      setError(t(voteErrorKey(res.error)));
      return;
    }
    if (res.data?.promoted && res.data.marketSlug) {
      setPromotedSlug(res.data.marketSlug);
    }
    onChanged?.();
  }

  async function remove() {
    setBusy(true);
    setError(null);
    const res = await removeSubmission(submission.id);
    setBusy(false);
    if (!res.ok) {
      setError(t("admin.controls.error"));
      return;
    }
    setRemoved(true);
    onChanged?.();
  }

  if (removed) {
    return (
      <li className="rounded-2xl border border-stone-200 bg-stone-50/60 p-4 text-sm italic text-stone-400">
        {t("admin.controls.removed")}
      </li>
    );
  }

  const days = submission.days as (Parameters<typeof dayName>[0])[];
  const remainingLabel =
    submission.remaining <= 1
      ? t("submissions.remainingOne")
      : t("submissions.remaining", { count: String(submission.remaining) });

  return (
    <li className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-stone-900">
            {submission.name}
          </h3>
          <p className="text-xs text-stone-500">{submission.regionName}</p>
        </div>
        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
          {t("provenance.community")}
        </span>
      </div>

      <ul className="mt-2 flex flex-wrap gap-1.5">
        {days.map((d) => (
          <li
            key={d}
            className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200"
          >
            {dayName(d, "long")}
          </li>
        ))}
      </ul>

      <dl className="mt-3 flex flex-col gap-1 text-sm text-stone-700">
        {submission.hoursText ? (
          <div className="flex gap-1.5">
            <dt className="font-medium text-stone-500">{t("submitMarket.hours")}:</dt>
            <dd>{submission.hoursText}</dd>
          </div>
        ) : null}
        {submission.referenceText ? (
          <div className="flex gap-1.5">
            <dt className="font-medium text-stone-500">
              {t("submitMarket.reference")}:
            </dt>
            <dd>{submission.referenceText}</dd>
          </div>
        ) : null}
        {submission.organizer ? (
          <div className="flex gap-1.5">
            <dt className="font-medium text-stone-500">
              {t("submitMarket.organizer")}:
            </dt>
            <dd>{submission.organizer}</dd>
          </div>
        ) : null}
        {submission.phones.length > 0 ? (
          <div className="flex gap-1.5">
            <dt className="font-medium text-stone-500">{t("submitMarket.phone")}:</dt>
            <dd>{submission.phones.join(", ")}</dd>
          </div>
        ) : null}
        {submission.mapUrl ? (
          <div className="flex gap-1.5">
            <dt className="font-medium text-stone-500">{t("submitMarket.mapUrl")}:</dt>
            <dd>
              <a
                href={submission.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 underline underline-offset-2"
              >
                {t("submitMarket.mapUrl")}
              </a>
            </dd>
          </div>
        ) : null}
      </dl>

      {submission.location ? (
        <div className="mt-3">
          <MarketMap location={submission.location} name={submission.name} />
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
        <span>
          {t("proposals.votes", {
            confirm: String(submission.confirmCount),
            reject: String(submission.rejectCount),
          })}
        </span>
        {!promotedSlug && (
          <span className="text-amber-700">{remainingLabel}</span>
        )}
      </div>

      {promotedSlug ? (
        <p className="mt-3 text-sm font-medium text-emerald-700">
          <Link
            href={`/market/${promotedSlug}`}
            className="underline underline-offset-2"
          >
            {t("submissions.promoted")}
          </Link>
        </p>
      ) : submission.own ? (
        <p className="mt-3 text-xs italic text-stone-400">
          {t("submissions.own")}
        </p>
      ) : status === "loading" ? null : signedIn ? (
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => vote("confirm")}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${
              submission.viewerVote === "confirm"
                ? "bg-emerald-600 text-white"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            {t("proposals.confirm")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => vote("reject")}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${
              submission.viewerVote === "reject"
                ? "bg-stone-600 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {t("proposals.reject")}
          </button>
          {busy && (
            <span className="text-xs text-stone-400">{t("proposals.working")}</span>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => signIn(ENTRA_PROVIDER)}
          className="mt-3 text-sm font-medium text-emerald-700 underline-offset-2 hover:underline"
        >
          {t("proposals.signInToConfirm")}
        </button>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2">
        <ReportSubmission id={submission.id} />
        {canModerate && (
          <button
            type="button"
            disabled={busy}
            onClick={remove}
            className="text-xs font-medium text-red-600 underline-offset-2 hover:underline disabled:opacity-50"
          >
            {t("moderation.action.remove")}
          </button>
        )}
      </div>
    </li>
  );
}

/** Paginated public queue of pending community submissions with confirm/reject controls. */
export function PendingSubmissions({
  initial,
  total,
  canModerate = false,
}: {
  initial: PendingSubmission[];
  total: number;
  canModerate?: boolean;
}) {
  const { t } = useTranslation();
  const [items, setItems] = useState(initial);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const hasMore = items.length < total;

  const loadMore = useCallback(async () => {
    setLoading(true);
    const next = page + 1;
    try {
      const res = await fetch(`/api/market-submissions?page=${next}`);
      if (res.ok) {
        const data = (await res.json()) as { submissions: PendingSubmission[] };
        setItems((prev) => [...prev, ...(data.submissions ?? [])]);
        setPage(next);
      }
    } finally {
      setLoading(false);
    }
  }, [page]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/market-submissions?page=1`);
      if (res.ok) {
        const data = (await res.json()) as { submissions: PendingSubmission[] };
        setItems(data.submissions ?? []);
        setPage(1);
      }
    } catch {
      // best-effort refresh
    }
  }, []);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center">
        <p className="text-sm text-stone-600">{t("submissions.empty")}</p>
        <Link
          href="/markets/new"
          className="mt-3 inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          {t("submissions.addCta")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-4">
        {items.map((s) => (
          <SubmissionCard
            key={s.id}
            submission={s}
            canModerate={canModerate}
            onChanged={refresh}
          />
        ))}
      </ul>
      {hasMore && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loading}
          className="mx-auto inline-flex items-center rounded-full border border-stone-300 bg-white px-5 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:opacity-50"
        >
          {loading ? t("proposals.working") : t("submissions.loadMore")}
        </button>
      )}
    </div>
  );
}
