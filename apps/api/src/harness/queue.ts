import { db } from "@/database";
import { movementWorkflows } from "@/tables";
import { env } from "@/env";
import { logger } from "@/logger";
import { isHarnessConfigured } from "./config";
import { asc, eq } from "drizzle-orm";
import { runWorkflow } from "./runner";

/**
 * In-process work queue. Runs are serialized per user with a promise
 * chain: only one decision loop is ever in flight per user, so each run
 * sees the full effects of all previous runs. That single property is
 * what prevents two movements from each creating a duplicate activity.
 */

const userChains = new Map<string, Promise<void>>();

export function enqueueWorkflow(workflowId: string, userId: string): void {
  const chain = userChains.get(userId) ?? Promise.resolve();
  const run = chain
    .then(() => runWorkflow(workflowId))
    .catch((error) => {
      logger.error({ workflowId, error }, "Harness workflow crashed");
    });
  userChains.set(userId, run);
  run.finally(() => {
    // Drop the chain once drained so the map does not grow unboundedly.
    if (userChains.get(userId) === run) {
      userChains.delete(userId);
    }
  });
}

/**
 * Re-enqueues a workflow after the retry backoff. Used by the runner when
 * a provider error is retryable.
 */
export function scheduleRetry(workflowId: string, userId: string): void {
  const timer = setTimeout(() => enqueueWorkflow(workflowId, userId), env.HARNESS_RETRY_DELAY_MS);
  // Do not keep the process alive for a pending retry.
  (timer as unknown as { unref?: () => void }).unref?.();
}

/**
 * Boots the harness: disabled when no API key is configured, otherwise
 * picks up every workflow still queued (e.g. left over from a previous
 * shutdown or a failed boot).
 */
export async function startHarness(): Promise<void> {
  if (!isHarnessConfigured()) {
    logger.info("AI harness disabled (no MISTRAL_API_KEY)");
    return;
  }

  const queued = await db
    .select({ id: movementWorkflows.id, user: movementWorkflows.user })
    .from(movementWorkflows)
    .where(eq(movementWorkflows.status, "queued"))
    .orderBy(asc(movementWorkflows.createdAt));

  for (const workflow of queued) {
    enqueueWorkflow(workflow.id, workflow.user);
  }

  logger.info(`AI harness started (${queued.length} queued workflows)`);
}
