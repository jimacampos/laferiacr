"use client";

import { signIn, useSession } from "next-auth/react";
import { useState } from "react";

import { MarketMap } from "@/components/MarketMap";
import { useTranslation } from "@/i18n/I18nProvider";
import { voteProposal } from "@/lib/contributions/api";
import { removeProposal } from "@/lib/contributions/adminApi";
import type { LocationValue, PendingProposal } from "@/lib/contributions/types";

const ENTRA_PROVIDER = "microsoft-entra-id";

function isLocation(value: string | LocationValue): value is LocationValue {
  return typeof value === "object" && value !== null && "lat" in value;
}

function ProposalCard({
  proposal,
  field,
  name,
  onChanged,
  canModerate,
}: {
  proposal: PendingProposal;
  field: "hours" | "location";
  name: string;
  onChanged: () => void;
  canModerate: boolean;
}) {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promoted, setPromoted] = useState(false);
  const [removed, setRemoved] = useState(false);

  const signedIn = Boolean(session?.user);

  async function vote(kind: "confirm" | "reject") {
    setBusy(true);
    setError(null);
    const res = await voteProposal(proposal.id, kind);
    setBusy(false);
    if (!res.ok) {
      setError(t("contribute.error"));
      return;
    }
    if (res.data?.promoted) setPromoted(true);
    onChanged();
  }

  async function remove() {
    setBusy(true);
    setError(null);
    const res = await removeProposal(proposal.id);
    setBusy(false);
    if (!res.ok) {
      setError(t("admin.controls.error"));
      return;
    }
    setRemoved(true);
    onChanged();
  }

  if (removed) {
    return (
      <li className="rounded-xl border border-stone-200 bg-stone-50/60 p-3 text-sm italic text-stone-400">
        {t("admin.controls.removed")}
      </li>
    );
  }

  const remainingLabel =
    proposal.remaining <= 1
      ? t("proposals.remainingOne")
      : t("proposals.remaining", { count: String(proposal.remaining) });

  return (
    <li className="rounded-xl border border-stone-200 bg-stone-50/60 p-3">
      {field === "location" && isLocation(proposal.value) ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-stone-800">
            {t("proposals.newLocation")}
          </p>
          <MarketMap location={proposal.value} name={name} />
        </div>
      ) : (
        <p className="text-sm font-medium text-stone-800">
          {String(proposal.value)}
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
        <span>
          {t("proposals.votes", {
            confirm: String(proposal.confirmCount),
            reject: String(proposal.rejectCount),
          })}
        </span>
        {!promoted && <span className="text-amber-700">{remainingLabel}</span>}
      </div>

      {promoted ? (
        <p className="mt-2 text-sm font-medium text-emerald-700">
          {t("proposals.promoted")}
        </p>
      ) : proposal.own ? (
        <p className="mt-2 text-xs italic text-stone-400">
          {t("proposals.ownProposal")}
        </p>
      ) : status === "loading" ? null : signedIn ? (
        <div className="mt-2.5 flex items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => vote("confirm")}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${
              proposal.viewerVote === "confirm"
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
              proposal.viewerVote === "reject"
                ? "bg-stone-600 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {t("proposals.reject")}
          </button>
          {busy && (
            <span className="text-xs text-stone-400">
              {t("proposals.working")}
            </span>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => signIn(ENTRA_PROVIDER)}
          className="mt-2.5 text-sm font-medium text-emerald-700 underline-offset-2 hover:underline"
        >
          {t("proposals.signInToConfirm")}
        </button>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {canModerate && (
        <div className="mt-2 border-t border-stone-200 pt-2">
          <button
            type="button"
            disabled={busy}
            onClick={remove}
            className="text-xs font-medium text-red-600 underline-offset-2 hover:underline disabled:opacity-50"
          >
            {t("moderation.action.remove")}
          </button>
        </div>
      )}
    </li>
  );
}

/** Pending proposals for one field, most-confirmed first, each with confirm/reject. */
export function ProposalList({
  proposals,
  field,
  name,
  onChanged,
  canModerate = false,
}: {
  proposals: PendingProposal[];
  field: "hours" | "location";
  name: string;
  onChanged: () => void;
  canModerate?: boolean;
}) {
  const { t } = useTranslation();
  if (proposals.length === 0) return null;

  return (
    <div className="mt-3">
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-stone-400">
        {t("proposals.pendingTitle")}
      </p>
      <ul className="flex flex-col gap-2">
        {proposals.map((p) => (
          <ProposalCard
            key={p.id}
            proposal={p}
            field={field}
            name={name}
            onChanged={onChanged}
            canModerate={canModerate}
          />
        ))}
      </ul>
    </div>
  );
}
