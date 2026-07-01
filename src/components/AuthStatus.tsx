"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useTranslation } from "@/i18n/I18nProvider";

const ENTRA_PROVIDER = "microsoft-entra-id";

const buttonClass =
  "inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export function AuthStatus() {
  const { t } = useTranslation();
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <span className={`${buttonClass} opacity-60`} aria-hidden="true">
        {t("auth.loading")}
      </span>
    );
  }

  if (session?.user) {
    const label = session.user.name ?? session.user.email ?? "";

    return (
      <div className="flex items-center gap-2">
        {label ? (
          <span className="hidden max-w-[9rem] truncate text-sm text-emerald-50/90 sm:inline">
            {label}
          </span>
        ) : null}
        <button type="button" onClick={() => signOut()} className={buttonClass}>
          {t("auth.signOut")}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => signIn(ENTRA_PROVIDER)}
      className={buttonClass}
    >
      {t("auth.signIn")}
    </button>
  );
}
