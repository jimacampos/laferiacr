import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client";

// Break-glass bootstrap (ADR-0013): grant the `super_admin` role in `user_roles`. Idempotent and
// separate from the market seed. The target user must have signed in at least once (the users row
// is upserted on login), so we key on their Entra `oid` (external_id) or sign-in email.
//
// Note: Entra External ID can mint a distinct user object (oid) per sign-in *method* (Microsoft,
// Google, email OTP), so one email may map to several `users` rows. When keyed by email we grant
// super_admin to *all* matching rows, so the operator is an admin no matter which method they use.

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

  // Match every account for the operator: a single row by oid, or all rows sharing the email.
  const users = await prisma.user.findMany({
    where: oid ? { externalId: oid } : { email: email as string },
    select: { id: true, externalId: true, email: true },
  });

  if (users.length === 0) {
    throw new Error(
      `No users row matches ${oid ? `oid=${oid}` : `email=${email}`}. ` +
        "Have the operator sign in once, then re-run this seed.",
    );
  }

  let granted = 0;
  let alreadyHad = 0;
  for (const user of users) {
    // Compound unique is (user_id, role, scope); scope is NULL for a global super_admin, and
    // Postgres treats NULLs as distinct, so upsert-on-unique won't dedupe. Guard with findFirst.
    const existing = await prisma.userRole.findFirst({
      where: { userId: user.id, role: "super_admin", scope: null },
      select: { id: true },
    });

    if (existing) {
      alreadyHad += 1;
      console.log(`• super_admin already on ${user.externalId}`);
      continue;
    }

    await prisma.userRole.create({
      data: { userId: user.id, role: "super_admin", scope: null },
    });
    granted += 1;
    console.log(`✓ Granted super_admin to ${user.email ?? user.externalId} (${user.externalId})`);
  }

  console.log(
    `Done: ${granted} newly granted, ${alreadyHad} already had it, ` +
      `${users.length} account(s) matched ${oid ? `oid=${oid}` : `email=${email}`}.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
