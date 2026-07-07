"use client";

import { useTranslation } from "@/i18n/I18nProvider";
import { ALPHABET, letterSectionId } from "@/lib/home";

const NON_ALPHA_LETTER = "#";

/**
 * Compact A–Z (+ "#") jump index for the name-first directory. Present letters link to their
 * section anchor; absent letters render as disabled, muted labels so the alphabet stays a
 * stable, scannable shape regardless of the current filter.
 */
export function AlphaIndex({ present }: { present: Set<string> }) {
  const { t } = useTranslation();
  const letters = [...ALPHABET, NON_ALPHA_LETTER];

  return (
    <nav
      aria-label={t("list.index")}
      className="flex flex-nowrap gap-0.5 overflow-x-auto rounded-2xl border border-stone-200 bg-white/90 p-1.5 shadow-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {letters.map((letter) => {
        const enabled = present.has(letter);
        if (!enabled) {
          return (
            <span
              key={letter}
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-stone-300"
            >
              {letter}
            </span>
          );
        }
        return (
          <a
            key={letter}
            href={`#${letterSectionId(letter)}`}
            aria-label={t("list.jumpTo", { letter })}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            {letter}
          </a>
        );
      })}
    </nav>
  );
}
