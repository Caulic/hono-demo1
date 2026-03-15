import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function sendResponse(
  event: any,
  status: "SUCCESS" | "FAILED",
  reason?: string,
) {
  const body = JSON.stringify({
    Status: status,
    Reason: reason || "See CloudWatch logs",
    PhysicalResourceId: event.LogicalResourceId,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
  });

  await fetch(event.ResponseURL, {
    method: "PUT",
    headers: { "Content-Type": "", "Content-Length": String(body.length) },
    body,
  });
}

export const handler = async (event: any) => {
  console.log("Migration event:", event.RequestType);

  if (event.RequestType === "Delete") {
    await sendResponse(event, "SUCCESS");
    return;
  }

  try {
    const connStr = process.env.DATABASE_URL!
      .replace(/\bsslmode=[^&]*&?/, "")
      .replace(/[?&]$/, "");

    const pool = new pg.Pool({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
    });

    const db = drizzle({ client: pool });

    await migrate(db, {
      migrationsFolder: path.join(__dirname, "migrations"),
    });

    await pool.end();

    console.log("Migration completed successfully");
    await sendResponse(event, "SUCCESS");
  } catch (error: any) {
    console.error("Migration failed:", error);
    await sendResponse(event, "FAILED", error.message);
  }
};
