import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import data from "../src/data/ferias.json";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set — point it at the target Postgres before seeding.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  const regionName = new Map(data.regions.map((region) => [region.id, region.name]));

  let count = 0;
  for (const feria of data.ferias) {
    // Official-derived fields from the source list. We still never touch `location`
    // (PostGIS point) so re-seeding cannot clobber community-verified coordinates
    // (Phase 3+). hours_text / reference_text / map_url now come from the official
    // source (the feria listing), so they are seeded here.
    const fields = {
      name: feria.name,
      regionId: feria.regionId,
      regionName: regionName.get(feria.regionId) ?? feria.regionId,
      days: feria.days,
      daysLabel: feria.daysLabel,
      hoursText: feria.hoursText ?? null,
      referenceText: feria.referenceText ?? null,
      mapUrl: feria.mapUrl ?? null,
      organizer: feria.administrator || null,
      phones: feria.phones,
      source: "official",
      status: "active",
    };

    await prisma.market.upsert({
      where: { slug: feria.id },
      update: fields,
      create: { slug: feria.id, ...fields },
    });
    count += 1;
  }

  console.log(`Seeded ${count} markets across ${data.regions.length} regions.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
