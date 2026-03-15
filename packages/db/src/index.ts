import { env } from "@hono-demo1/env/server";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

import * as schema from "./schema";

function buildPool(connectionString: string, useSsl: boolean) {
  if (!useSsl) return new pg.Pool({ connectionString });
  const url = new URL(connectionString);
  url.searchParams.delete("sslmode");
  return new pg.Pool({
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: false },
  });
}

const pool = buildPool(env.DATABASE_URL, env.NODE_ENV === "production");

export const db = drizzle({ client: pool, schema });

export * from "./schema";
