import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function createDb() {
  const client = postgres(process.env.DATABASE_URL!, { max: 1 });
  const db = drizzle(client, { schema });
  return { client, db };
}

export type Db = ReturnType<typeof createDb>["db"];

// Cloudflare Workers: new connection per request, then close it
export async function withDb<T>(fn: (db: Db) => Promise<T>) {
  const { client, db } = createDb();

  try {
    return await fn(db);
  } finally {
    await client.end({ timeout: 5 });
  }
}
