"use client";

import { useState } from "react";
import { signIn, useSession } from "next-auth/react";

import { useTranslation } from "@/i18n/I18nProvider";
import { submitFeedback } from "@/lib/contributions/api";
import { FEEDBACK_MAX_LENGTH } from "@/lib/contributions/config";

const ENTRA_PROVIDER = "microsoft-entra-id";

/**
 * Sign-in-only feedback form. Signed-out visitors get a sign-in prompt instead of the form;
 * signed-in users can send a free-text message. The current page path is sent as context.
 */
export function FeedbackForm() {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (status === "loading") {
    return <p className="text-sm text-stone-500">{t("auth.loading")}</p>;
  }

  if (!session?.user) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <p className="text-sm text-stone-600">{t("feedback.signInPrompt")}</p>
        <button
          type="button"
          onClick={() => signIn(ENTRA_PROVIDER)}
          className="mt-3 inline-flex items-center rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          {t("auth.signIn")}
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-sm text-emerald-800">{t("feedback.thanks")}</p>
        <button
          type="button"
          onClick={() => setDone(false)}
          className="mt-2 text-sm font-medium text-emerald-700 underline-offset-2 hover:underline"
        >
          {t("feedback.sendAnother")}
        </button>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    const pageUrl =
      typeof window !== "undefined"
        ? window.location.pathname + window.location.search
        : undefined;
    const res = await submitFeedback(trimmed, pageUrl);
    setBusy(false);
    if (!res.ok) {
      if (res.status === 401) {
        setError(t("feedback.signInPrompt"));
      } else if (res.status === 429) {
        setError(t("feedback.rateLimited"));
      } else {
        setError(t("feedback.error"));
      }
      return;
    }
    setValue("");
    setDone(true);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label htmlFor="feedback-message" className="text-sm font-medium text-stone-700">
        {t("feedback.label")}
      </label>
      <textarea
        id="feedback-message"
        value={value}
        maxLength={FEEDBACK_MAX_LENGTH}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t("feedback.placeholder")}
        rows={5}
        className="rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />
      <p className="text-xs text-stone-400">
        {value.length}/{FEEDBACK_MAX_LENGTH}
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <button
          type="submit"
          disabled={busy || value.trim().length === 0}
          className="inline-flex items-center rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy ? t("feedback.submitting") : t("feedback.submit")}
        </button>
      </div>
    </form>
  );
}
