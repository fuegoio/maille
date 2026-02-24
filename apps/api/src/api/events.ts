import type { SyncEvent } from "@maille/core/sync";
import { builder } from "./builder";
import { createPubSub } from "graphql-yoga";
import { db } from "@/database";
import { events } from "@/tables";
import { and, eq, gt, not } from "drizzle-orm";
import { logger } from "@/logger";

export const EventSchema = builder.objectRef<SyncEvent>("Event");

EventSchema.implement({
  fields: (t) => ({
    type: t.exposeString("type"),
    payload: t.field({
      type: "String",
      resolve: (parent) => JSON.stringify(parent.payload),
    }),
    createdAt: t.field({
      type: "Float",
      resolve: (parent) => parent.createdAt.getTime() / 1000,
    }),
    clientId: t.field({
      type: "String",
      resolve: (parent) => parent.clientId,
    }),
    user: t.field({
      type: "String",
      resolve: (parent) => parent.user,
    }),
  }),
});

export const pubSub = createPubSub<{
  events: [userId: string, event: SyncEvent];
}>();

builder.subscriptionType({
  fields: (t) => ({
    events: t.field({
      type: EventSchema,
      description: "Events related to posts",
      subscribe: (root, args, ctx) => pubSub.subscribe("events", ctx.user.id),
      resolve: (payload) => payload,
    }),
  }),
});

builder.queryField("events", (t) =>
  t.field({
    type: [EventSchema],
    args: {
      lastSync: t.arg({
        type: "Float",
      }),
    },
    resolve: async (root, args, ctx) => {
      const lastSyncDate = new Date(args.lastSync);
      const eventsQuery = await db
        .select()
        .from(events)
        .where(
          and(
            gt(events.createdAt, lastSyncDate),
            eq(events.user, ctx.user.id),
            not(eq(events.clientId, ctx.session.id)),
          ),
        );

      logger.info(
        `[${ctx.user.id}] ${eventsQuery.length} events to catch up since ${lastSyncDate.toISOString()}`,
      );

      const syncEvents = eventsQuery.map(
        (event) =>
          ({
            ...event,
            payload: JSON.parse(event.payload),
          }) as SyncEvent,
      );

      return syncEvents;
    },
  }),
);

export const addEvent = async (event: SyncEvent) => {
  await db.insert(events).values({
    ...event,
    payload: JSON.stringify(event.payload),
  });
  pubSub.publish("events", event.user, event);
  return event;
};
