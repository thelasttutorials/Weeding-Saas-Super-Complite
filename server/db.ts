import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, PoolClient } from "pg";
import * as schema from "@shared/schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const db = drizzle(pool, { schema });

export type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Executes a callback within a transaction that has the current user's ID
 * set as a transaction-local PostgreSQL setting (app.current_user_id).
 *
 * This is the mechanism that activates Row Level Security policies on
 * user-owned tables. The setting is transaction-scoped (SET LOCAL), so it
 * is automatically cleared when the transaction ends — safe with connection pools.
 *
 * Usage (in authenticated routes):
 *   await withUserContext(userId(req), async (s) => {
 *     const invitations = await s.getInvitationsByUser(userId(req));
 *     res.json(invitations);
 *   });
 */
export async function withUserContext<T>(
  currentUserId: string,
  fn: (userDb: DrizzleDB) => Promise<T>
): Promise<T> {
  const client: PoolClient = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "SELECT set_config('app.current_user_id', $1, true)",
      [currentUserId],
    );
    const userDb = drizzle(client as any, { schema });
    const result = await fn(userDb);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
