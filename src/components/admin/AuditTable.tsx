"use client";

import { useTranslation } from "@/i18n/I18nProvider";
import type { AuditEntry } from "@/lib/contributions/adminApi";

function shortId(id: string | null): string {
  if (!id) return "—";
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

/** Read-only moderation audit trail (newest first), sourced from moderation_actions. */
export function AuditTable({ entries }: { entries: AuditEntry[] }) {
  const { t, lang } = useTranslation();

  if (entries.length === 0) {
    return (
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-stone-900">{t("audit.title")}</h2>
        <p className="rounded-2xl border border-stone-200 bg-white p-6 text-center text-sm text-stone-500">
          {t("audit.empty")}
        </p>
      </section>
    );
  }

  const fmt = new Intl.DateTimeFormat(lang === "es" ? "es-CR" : "en-US", {
    dateStyle: "short",
    timeStyle: "short",
  });

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-stone-900">{t("audit.title")}</h2>
      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-400">
            <tr>
              <th className="px-4 py-2 font-medium">{t("audit.col.when")}</th>
              <th className="px-4 py-2 font-medium">{t("audit.col.actor")}</th>
              <th className="px-4 py-2 font-medium">{t("audit.col.action")}</th>
              <th className="px-4 py-2 font-medium">{t("audit.col.target")}</th>
              <th className="px-4 py-2 font-medium">{t("audit.col.reason")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {entries.map((e) => (
              <tr key={e.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-2 text-stone-500">
                  {fmt.format(new Date(e.createdAt))}
                </td>
                <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-stone-500">
                  {shortId(e.actorId)}
                </td>
                <td className="px-4 py-2">
                  <span className="inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 font-mono text-xs text-stone-700">
                    {e.action}
                  </span>
                </td>
                <td className="px-4 py-2 text-stone-600">
                  {e.targetType}
                  {e.targetId ? (
                    <span className="ml-1 font-mono text-xs text-stone-400">
                      {shortId(e.targetId)}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-2 text-stone-600">{e.reason ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
