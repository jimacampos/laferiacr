"use client";

import type { Feria } from "@/data/types";
import { groupFeriasByLetter, letterSectionId } from "@/lib/home";
import { MarketCard } from "./MarketCard";

export function MarketList({
  ferias,
  query = "",
}: {
  ferias: Feria[];
  query?: string;
}) {
  const groups = groupFeriasByLetter(ferias);

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section
          key={group.letter}
          id={letterSectionId(group.letter)}
          aria-labelledby={`${letterSectionId(group.letter)}-heading`}
          className="scroll-mt-20"
        >
          <h3
            id={`${letterSectionId(group.letter)}-heading`}
            className="mb-3 flex items-center gap-3 text-sm font-bold uppercase tracking-wider text-emerald-700"
          >
            <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100">
              {group.letter}
            </span>
            <span className="h-px flex-1 bg-stone-200" />
          </h3>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.ferias.map((feria) => (
              <li key={feria.id}>
                <MarketCard feria={feria} query={query} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
