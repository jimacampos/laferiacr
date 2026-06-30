import { HomeClient } from "./HomeClient";
import { getMarketsData } from "@/lib/markets";

// Reads run per request so the DB-backed source (DATA_SOURCE=db) is always current;
// with the static fallback this simply renders the same list on the server.
export const dynamic = "force-dynamic";

export default async function Home() {
  const { ferias, regions } = await getMarketsData();
  return <HomeClient ferias={ferias} regions={regions} />;
}
