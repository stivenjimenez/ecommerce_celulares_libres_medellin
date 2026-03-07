import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "@/db/schema";

function getConnectionString(): string | undefined {
  return (
    process.env.DATABASE_URL ??
    process.env.SUPABASE_DB_URL ??
    process.env.POSTGRES_URL
  );
}

type PostgresClient = ReturnType<typeof postgres>;
type DrizzleClient = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as {
  sql?: PostgresClient;
  drizzle?: DrizzleClient;
};

export function hasDatabaseConnection(): boolean {
  return Boolean(getConnectionString());
}

export function getDb(): DrizzleClient {
  const connectionString = getConnectionString();
  if (!connectionString) {
    throw new Error(
      "Missing DATABASE_URL (or SUPABASE_DB_URL / POSTGRES_URL) in environment",
    );
  }

  if (globalForDb.drizzle) {
    return globalForDb.drizzle;
  }

  const sqlClient =
    globalForDb.sql ??
    postgres(connectionString, {
      prepare: false,
      max: 10,
    });

  const drizzleClient = drizzle(sqlClient, { schema });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.sql = sqlClient;
    globalForDb.drizzle = drizzleClient;
  }

  return drizzleClient;
}
