#!/usr/bin/env node
// Run a single SQL statement against DATABASE_URL and print the result.
//
// Uses the `pg` driver (already a project dependency) so you do NOT need psql/libpq
// installed. Intended to be invoked by scripts/db-azure.sh, which sets DATABASE_URL to the
// Azure connection string, but it works anywhere DATABASE_URL is set.
//
// Usage: DATABASE_URL=... node scripts/db-query.mjs "SELECT id, email FROM users LIMIT 10"

import pg from "pg";

const { Client } = pg;

const sql = process.argv.slice(2).join(" ").trim();
const url = process.env.DATABASE_URL;

if (!url) {
  console.error("DATABASE_URL is not set — point it at the target Postgres first.");
  process.exit(1);
}
if (!sql) {
  console.error('Usage: node scripts/db-query.mjs "<SQL>"');
  process.exit(1);
}

// Azure Postgres requires TLS. We set TLS behavior explicitly (connect over TLS but don't pin
// the Azure CA — fine for this ad-hoc dev tool), and drop any `sslmode` from the URL so the pg
// driver doesn't emit its sslmode-alias deprecation warning. A short connect timeout fails fast
// if the firewall rule / your IP is wrong rather than hanging.
const parsedUrl = new URL(url);
parsedUrl.searchParams.delete("sslmode");
const client = new Client({
  connectionString: parsedUrl.toString(),
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

function report(result) {
  if (result.rows && result.rows.length > 0) {
    console.table(result.rows);
    console.log(`(${result.rowCount} row${result.rowCount === 1 ? "" : "s"})`);
  } else {
    const verb = result.command ?? "OK";
    const count = typeof result.rowCount === "number" ? ` ${result.rowCount}` : "";
    console.log(`${verb}${count}`);
  }
}

try {
  await client.connect();
  const result = await client.query(sql);
  // Multiple statements come back as an array of results.
  if (Array.isArray(result)) result.forEach(report);
  else report(result);
} catch (err) {
  console.error("Query failed:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await client.end();
}
