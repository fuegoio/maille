import { db } from "@/database";
import { session as sessionTable } from "@/tables";

/**
 * The harness acts as a first-class API client, like the CLI: it owns a
 * long-lived better-auth session per user and calls the same GraphQL
 * mutations as any other client. That gives it the same history computation,
 * the same sync events, and `clientId` attribution on everything it writes.
 */

const HARNESS_CLIENT_PREFIX = "harness";

const HARNESS_SESSION_DURATION_MS = 365 * 24 * 60 * 60 * 1000;

export const harnessSessionId = (userId: string) => `${HARNESS_CLIENT_PREFIX}-${userId}`;

export const isHarnessSession = (sessionId: string) =>
  sessionId.startsWith(`${HARNESS_CLIENT_PREFIX}-`);

/**
 * Ensures the harness' machine session exists for the user and returns its
 * bearer token. The session id is stable (`harness-<userId>`), so events and
 * history entries written by the harness carry a stable client id across
 * restarts; the token rotates on each boot.
 */
export async function ensureHarnessSession(userId: string): Promise<string> {
  const id = harnessSessionId(userId);
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + HARNESS_SESSION_DURATION_MS);

  const rows = await db
    .insert(sessionTable)
    .values({ id, token, expiresAt, userId })
    .onConflictDoUpdate({
      target: sessionTable.id,
      set: { token, expiresAt, updatedAt: new Date() },
    })
    .returning({ token: sessionTable.token });

  const row = rows[0];
  if (!row) {
    throw new Error(`Failed to ensure harness session for user ${userId}`);
  }
  return row.token;
}
