"use client";

import type { Feria } from "@/data/types";
import { MarketCard } from "./MarketCard";

export function MarketList({ ferias }: { ferias: Feria[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {ferias.map((feria) => (
        <li key={feria.id}>
          <MarketCard feria={feria} />
        </li>
      ))}
    </ul>
  );
}
