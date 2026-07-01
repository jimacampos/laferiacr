import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client";

// Break-glass bootstrap (ADR-0013): grant one operator the `super_admin` role in
// `user_roles`. Idempotent and separate from the market seed. The target user must have
// signed in at least once (the users row is upserted on login), so we key on their Entra
// `oid` (external_id) or sign-in email rather than creating an account here.

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set — point it at the target Postgres before seeding.");
}

const oid = process.env.SUPER_ADMIN_OID?.trim() || null;
const email = process.env.SUPER_ADMIN_EMAIL?.trim() || null;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  if (!oid && !email) {
    throw new Error(
      "Set SUPER_ADMIN_OID (Entra oid) or SUPER_ADMIN_EMAIL to the operator to promote.",
    );
  }

  const user = await prisma.user.findFirst({
    where: oid ? { externalId: oid } : { email: email as string },
    select: { id: true, externalId: true, email: true },
  });

  if (!user) {
    throw new Error(
      `No users row matches ${oid ? `oid=${oid}` : `email=${email}`}. ` +
        "Have the operator sign in once, then re-run this seed.",
    );
  }

  // Compound unique is (user_id, role, scope); scope is NULL for a global super_admin, and
  // Postgres treats NULLs as distinct, so upsert-on-unique won't dedupe. Guard with findFirst.
  const existing = await prisma.userRole.findFirst({
    where: { userId: user.id, role: "super_admin", scope: null },
    select: { id: true },
  });

  if (existing) {
    console.log(`super_admin already granted to ${user.externalId}`);
    return;
  }

  await prisma.userRole.create({
    data: { userId: user.id, role: "super_admin", scope: null },
  });
  console.log(`Granted super_admin to ${user.email ?? user.externalId}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
