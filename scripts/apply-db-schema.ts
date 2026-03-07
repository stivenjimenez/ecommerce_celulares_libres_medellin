import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

function getConnectionString(): string {
  const value =
    process.env.DATABASE_URL ??
    process.env.SUPABASE_DB_URL ??
    process.env.POSTGRES_URL;

  if (!value) {
    throw new Error(
      "Missing DATABASE_URL (or SUPABASE_DB_URL / POSTGRES_URL) in .env.local",
    );
  }

  return value;
}

async function main() {
  const sqlText = await readFile(
    resolve(process.cwd(), "db/migrations/0000_init.sql"),
    "utf8",
  );
  const connectionString = getConnectionString();
  const client = postgres(connectionString, { prepare: false, max: 1 });

  try {
    await client.unsafe(sqlText);
    console.log("Schema applied successfully.");
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
