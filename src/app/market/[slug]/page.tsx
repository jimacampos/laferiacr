import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { MarketDetailView } from "@/components/MarketDetailView";
import { getViewerAccess } from "@/lib/contributions/access";
import {
  EMPTY_CONTRIBUTIONS,
  getMarketContributions,
} from "@/lib/contributions/proposals";
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
  const access = await getViewerAccess();

  // Public reads see active markets only; a moderator may open a hidden one (e.g. to unhide it).
  let market = await loadMarket(slug);
  if (!market && access.isModerator) {
    market = await getMarketBySlug(slug, { includeHidden: true });
  }
  if (!market) notFound();

  const contributions = market.dbId
    ? await getMarketContributions(market.dbId, access.userId ?? undefined)
    : EMPTY_CONTRIBUTIONS;

  return (
    <MarketDetailView
      market={market}
      contributions={contributions}
      viewer={{
        isModerator: access.isModerator,
        isSuperAdmin: access.isSuperAdmin,
      }}
    />
  );
}
