"use client";

import { useState } from "react";

import { useTranslation } from "@/i18n/I18nProvider";
import { ROLE_INFO } from "@/lib/contributions/roleInfo";

/**
 * Role explainer for the Roles screen (BL-019). Each role has an info **(i)** toggle that
 * reveals what it grants. It's a real disclosure button — click / Enter / Space toggle it and
 * Escape closes it — so it works with keyboard and touch (not hover-only). Copy is bilingual
 * via `dictionaries.ts`, sourced from the rbac.md capability matrix.
 */
export function RoleLegend() {
  const { t } = useTranslation();
  const [openRole, setOpenRole] = useState<string | null>(null);

  return (
    <section
      aria-labelledby="role-legend-title"
      className="rounded-2xl border border-stone-200 bg-stone-50/60 p-4"
    >
      <h3
        id="role-legend-title"
        className="text-xs font-semibold uppercase tracking-wide text-stone-500"
      >
        {t("roles.legendTitle")}
      </h3>
      <ul className="mt-2 flex flex-col gap-1.5">
        {ROLE_INFO.map(({ role, labelKey, descriptionKey }) => {
          const isOpen = openRole === role;
          const descId = `role-desc-${role}`;
          return (
            <li key={role}>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={descId}
                onClick={() => setOpenRole(isOpen ? null : role)}
                onKeyDown={(e) => {
                  if (e.key === "Escape" && isOpen) setOpenRole(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-full text-sm font-medium text-stone-800 transition hover:text-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <span
                  aria-hidden="true"
                  className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold transition ${
                    isOpen
                      ? "bg-emerald-600 text-white"
                      : "bg-stone-200 text-stone-600"
                  }`}
                >
                  i
                </span>
                {t(labelKey)}
              </button>
              <p
                id={descId}
                hidden={!isOpen}
                className="mt-1 pl-6 text-xs leading-relaxed text-stone-600"
              >
                {t(descriptionKey)}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
