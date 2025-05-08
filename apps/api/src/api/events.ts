import type { SyncEvent } from "@maille/core/sync";
import { builder } from "./builder";
import { createPubSub } from "graphql-yoga";
import { db } from "@/database";
import { events } from "@/tables";
import { and, eq, gt } from "drizzle-orm";
import type { UUID } from "crypto";
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
      type: "UUID",
      resolve: (parent) => parent.clientId,
    }),
  }),
});

export const pubSub = createPubSub<{
  events: [userId: UUID, event: SyncEvent];
}>();

builder.subscriptionType({
  fields: (t) => ({
    events: t.field({
      type: EventSchema,
      description: "Events related to posts",
      subscribe: (root, args, ctx) => pubSub.subscribe("events", ctx.user),
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
          and(gt(events.createdAt, lastSyncDate), eq(events.user, ctx.user)),
        );

      logger.info(
        `[${ctx.user}] ${eventsQuery.length} events to catch up since ${lastSyncDate}`,
      );

      return eventsQuery.map((event) => ({
        ...event,
        payload: JSON.parse(event.payload),
      }));
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
