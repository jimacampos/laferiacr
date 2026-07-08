import type { Metadata } from "next";

import { TranslatedHeading } from "@/components/TranslatedHeading";
import { SubmitMarketForm } from "@/components/contributions/SubmitMarketForm";
import { getMarketsData } from "@/lib/markets";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Agregar una feria — La Feria CR",
};

export default async function NewMarketPage() {
  const { regions } = await getMarketsData();
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <TranslatedHeading titleKey="submitMarket.title" subtitleKey="submitMarket.subtitle" />
      <div className="mt-6">
        <SubmitMarketForm regions={regions} />
      </div>
    </div>
  );
}
