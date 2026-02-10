import type { Movement, MovementActivity } from "@maille/core/movements";
import { builder } from "@/api/builder";

export const MovementSchema = builder.objectRef<Movement>("Movement");

MovementSchema.implement({
  fields: (t) => ({
    id: t.field({
      type: "String",
      resolve: (parent) => parent.id,
    }),
    date: t.field({
      type: "Date",
      resolve: (parent) => parent.date,
    }),
    amount: t.exposeFloat("amount"),
    account: t.field({
      type: "String",
      resolve: (parent) => parent.account,
    }),
    name: t.exposeString("name"),
    activities: t.field({
      type: [MovementActivitySchema],
      resolve: (parent) => parent.activities,
    }),
    status: t.exposeString("status"),
  }),
});

export const MovementActivitySchema = builder.objectRef<MovementActivity>("MovementActivity");

MovementActivitySchema.implement({
  fields: (t) => ({
    id: t.field({
      type: "String",
      resolve: (parent) => parent.id,
    }),
    activity: t.field({
      type: "String",
      resolve: (parent) => parent.activity,
    }),
    amount: t.exposeFloat("amount"),
  }),
});

export const DeleteMovementResponseSchema = builder.objectRef<{
  id: string;
  success: boolean;
}>("DeleteMovementResponse");

DeleteMovementResponseSchema.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    success: t.exposeBoolean("success"),
  }),
});

export const DeleteMovementActivityResponseSchema = builder.objectRef<{
  id: string;
  success: boolean;
}>("DeleteMovementActivityResponse");

DeleteMovementActivityResponseSchema.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    success: t.exposeBoolean("success"),
  }),
});
