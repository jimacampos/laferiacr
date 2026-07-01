import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { MarketDetailView } from "@/components/MarketDetailView";
import { getMarketBySlug } from "@/lib/markets";

// Reads run per request so the DB-backed source (DATA_SOURCE=db) is always current;
// with the static fallback this renders the same detail deterministically.
export const dynamic = "force-dynamic";

// Dedupe the lookup shared by generateMetadata and the page render.
const loadMarket = cache(getMarketBySlug);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const market = await loadMarket(slug);
  if (!market) return { title: "La Feria CR" };
  return {
    title: `${market.name} — La Feria CR`,
    description: `${market.name}, ${market.regionName}. ${market.daysLabel}.`,
  };
}

export default async function MarketPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const market = await loadMarket(slug);
  if (!market) notFound();

  return <MarketDetailView market={market} />;
}
