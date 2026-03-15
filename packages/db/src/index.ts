import { env } from "@hono-demo1/env/server";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

import * as schema from "./schema";

const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  ssl:
    env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : undefined,
});

export const db = drizzle({ client: pool, schema });

export * from "./schema";
