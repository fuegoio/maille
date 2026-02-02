import type { SyncEvent } from "@maille/core/sync";
import { builder } from "./builder";
import { createPubSub } from "graphql-yoga";
import { db } from "@/database";
import { events } from "@/tables";
import { and, eq, gt } from "drizzle-orm";
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
      const lastSyncDate = new Date(args.lastSync * 1000);
      const eventsQuery = await db
        .select()
        .from(events)
        .where(
          and(gt(events.createdAt, lastSyncDate), eq(events.user, ctx.user.id)),
        );

      logger.info(
        `[${ctx.user.id}] ${eventsQuery.length} events to catch up since ${lastSyncDate}`,
      );

      const syncEvents = eventsQuery.map(
        (event) =>
          ({
            type: event.type,
            payload: JSON.parse(event.payload),
            createdAt: event.createdAt,
            clientId: event.clientId,
            user: event.user,
          }) as SyncEvent,
      );

      return syncEvents;
    },
  }),
);

export const addEvent = async (event: SyncEvent) => {
  await db.insert(events).values({
    type: event.type,
    user: event.user,
    payload: JSON.stringify(event.payload),
    createdAt: event.createdAt,
    clientId: event.clientId,
  });
  pubSub.publish("events", event.user, event);
  return event;
};
