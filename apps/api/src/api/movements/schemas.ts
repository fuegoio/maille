import type { Movement, MovementActivity } from "@maille/core/movements";
import { builder } from "@/api/builder";
import type { UUID } from "crypto";

export const MovementSchema = builder.objectRef<Movement>("Movement");

MovementSchema.implement({
  fields: (t) => ({
    id: t.field({
      type: "UUID",
      resolve: (parent) => parent.id,
    }),
    date: t.field({
      type: "Date",
      resolve: (parent) => parent.date.toDate(),
    }),
    amount: t.exposeFloat("amount"),
    account: t.field({
      type: "UUID",
      resolve: (parent) => parent.account,
    }),
    name: t.exposeString("name"),
    workspace: t.field({
      type: "UUID",
      resolve: (parent) => {
        if (!parent.workspace) {
          throw new Error("Workspace is required for movements");
        }
        return parent.workspace;
      },
    }),
    activities: t.field({
      type: [MovementActivitySchema],
      resolve: (parent) => parent.activities,
    }),
    status: t.exposeString("status"),
  }),
});

export const MovementActivitySchema =
  builder.objectRef<MovementActivity>("MovementActivity");

MovementActivitySchema.implement({
  fields: (t) => ({
    id: t.field({
      type: "UUID",
      resolve: (parent) => parent.id,
    }),
    activity: t.field({
      type: "UUID",
      resolve: (parent) => parent.activity,
    }),
    amount: t.exposeFloat("amount"),
    workspace: t.field({
      type: "UUID",
      resolve: (parent) => {
        if (!parent.workspace) {
          throw new Error("Workspace is required for movement activities");
        }
        return parent.workspace;
      },
    }),
  }),
});

export const DeleteMovementResponseSchema = builder.objectRef<{
  id: UUID;
  success: boolean;
}>("DeleteMovementResponse");

DeleteMovementResponseSchema.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    success: t.exposeBoolean("success"),
  }),
});

export const DeleteMovementActivityResponseSchema = builder.objectRef<{
  id: UUID;
  success: boolean;
}>("DeleteMovementActivityResponse");

DeleteMovementActivityResponseSchema.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    success: t.exposeBoolean("success"),
  }),
});
