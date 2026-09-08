import { buildLinkEntry } from "@maille/core/history";
import { and, eq, like } from "drizzle-orm";
import { GraphQLError } from "graphql";
import { db } from "@/database";
import { activities, movements, movementsActivities } from "@/tables";
import { idPattern } from "@/api/idPrefix";
import { addEvent } from "@/api/events";
import { computeHistory, emitHistoryEvents } from "@/api/history/history";
import { cancelWorkflowIfActive, workflowClientId } from "@/workflows/store";

export type LinkMovementToActivityArgs = {
  id: string;
  movementId: string;
  activityId: string;
  amount: number;
};

/**
 * Links a movement to an activity. The canonical implementation shared by the
 * `createMovementActivity` GraphQL mutation and the AI workflows, so both go
 * through the same history, sync events and workflow hooks.
 */
export async function linkMovementToActivity(
  userId: string,
  clientId: string,
  args: LinkMovementToActivityArgs,
) {
  const writer = { user: { id: userId }, session: { id: clientId } };

  const movement = (
    await db
      .select()
      .from(movements)
      .where(and(like(movements.id, idPattern(args.movementId)), eq(movements.user, userId)))
      .limit(1)
  )[0];
  if (!movement) {
    throw new GraphQLError("Movement not found");
  }

  const activity = (
    await db
      .select()
      .from(activities)
      .where(and(like(activities.id, idPattern(args.activityId)), eq(activities.user, userId)))
      .limit(1)
  )[0];
  if (!activity) {
    throw new GraphQLError("Activity not found");
  }

  const insertedMovementActivities = await db
    .insert(movementsActivities)
    .values({
      id: args.id,
      movement: movement.id,
      activity: activity.id,
      amount: args.amount,
    })
    .onConflictDoNothing()
    .returning();
  const movementActivity = insertedMovementActivities[0];

  if (!movementActivity) {
    // Retry of an already-applied mutation — nothing changed, no history.
    return {
      id: args.id,
      movement: movement.id,
      activity: activity.id,
      amount: args.amount,
    };
  }

  // History: link entry on both timelines.
  const movementHistory = computeHistory(writer, movement.history, [
    buildLinkEntry(
      "movement",
      movement.id,
      {
        type: "activity",
        id: activity.id,
        label: activity.name,
      },
      args.amount,
    ),
  ]);
  const activityHistory = computeHistory(writer, activity.history, [
    buildLinkEntry(
      "activity",
      activity.id,
      {
        type: "movement",
        id: movement.id,
        label: movement.name,
      },
      args.amount,
    ),
  ]);

  await db
    .update(movements)
    .set({ history: movementHistory.history })
    .where(eq(movements.id, movement.id));
  await db
    .update(activities)
    .set({ history: activityHistory.history })
    .where(eq(activities.id, activity.id));

  await addEvent({
    type: "createMovementActivity",
    payload: {
      id: movementActivity.id,
      movement: movement.id,
      activity: activity.id,
      amount: args.amount,
    },
    createdAt: new Date(),
    clientId,
    user: userId,
  });
  await emitHistoryEvents(writer, movementHistory.emitted);
  await emitHistoryEvents(writer, activityHistory.emitted);

  // AI workflows: a manual link by the user cancels the movement's active
  // workflow — the assistant never fights the user. Links made by the
  // the workflow itself do not.
  if (clientId !== workflowClientId(userId)) {
    await cancelWorkflowIfActive(userId, movement.id, clientId);
  }

  return movementActivity;
}
