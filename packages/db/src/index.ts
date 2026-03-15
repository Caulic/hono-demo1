import { env } from "@hono-demo1/env/server";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "./schema";

export const db = drizzle({
  connection: {
    connectionString: env.DATABASE_URL,
    ssl:
      env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : undefined,
  },
  schema,
});

export * from "./schema";
