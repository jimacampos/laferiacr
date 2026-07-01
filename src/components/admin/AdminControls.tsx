"use client";

import { useState } from "react";

import { useTranslation } from "@/i18n/I18nProvider";
import { moderateMarket } from "@/lib/contributions/adminApi";

/** Inline moderation controls on the market detail page. Community Safety can hide/unhide the
 * market; Super Admin additionally can revert a field to its previous verified value. Full
 * override/role/config tooling lives in the /admin area. */
export function AdminControls({
  slug,
  hidden,
  isSuperAdmin,
  onChanged,
}: {
  slug: string;
  hidden: boolean;
  isSuperAdmin: boolean;
  onChanged: () => void;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run(body: Record<string, unknown>, okKey: string) {
    setBusy(true);
    setMessage(null);
    const res = await moderateMarket(slug, body);
    setBusy(false);
    if (!res.ok) {
      setMessage(res.error === "no_history" ? t("admin.controls.noHistory") : t("admin.controls.error"));
      return;
    }
    setMessage(t(okKey));
    onChanged();
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
        {t("admin.controls.title")}
      </p>
      {hidden && (
        <p className="mb-2 text-sm font-medium text-amber-800">
          {t("admin.controls.hidden")}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            run(
              { action: hidden ? "unhide" : "hide" },
              hidden ? "admin.controls.unhiddenDone" : "admin.controls.hiddenDone",
            )
          }
          className="rounded-full bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
        >
          {hidden ? t("admin.controls.unhide") : t("admin.controls.hide")}
        </button>

        {isSuperAdmin && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                run(
                  { action: "revert", field: "hours" },
                  "admin.controls.reverted",
                )
              }
              className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-stone-700 ring-1 ring-stone-300 transition hover:bg-stone-50 disabled:opacity-50"
            >
              {t("admin.controls.revertHours")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                run(
                  { action: "revert", field: "location" },
                  "admin.controls.reverted",
                )
              }
              className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-stone-700 ring-1 ring-stone-300 transition hover:bg-stone-50 disabled:opacity-50"
            >
              {t("admin.controls.revertLocation")}
            </button>
          </>
        )}
        {message && <span className="text-xs text-stone-600">{message}</span>}
      </div>
    </div>
  );
}
