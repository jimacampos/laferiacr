"use client";

import type { Feria, Region } from "@/data/types";
import { MarketCard } from "./MarketCard";

export function MarketList({
  ferias,
  regions,
}: {
  ferias: Feria[];
  regions: Region[];
}) {
  const regionNames = new Map(regions.map((region) => [region.id, region.name]));

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {ferias.map((feria) => (
        <li key={feria.id}>
          <MarketCard
            feria={feria}
            regionName={regionNames.get(feria.regionId)}
          />
        </li>
      ))}
    </ul>
  );
}
