import { builder } from "@/api/builder";
import type {
  Activity,
  Transaction,
  ActivityMovement,
  ActivityCategory,
  ActivitySubCategory,
} from "@maille/core/activities";
import type { Liability } from "@maille/core/liabilities";
import type { UUID } from "crypto";

export const ActivitySchema = builder.objectRef<
  Activity & { liabilities?: Liability[] }
>("Activity");

ActivitySchema.implement({
  fields: (t) => ({
    id: t.field({
      type: "UUID",
      resolve: (parent) => parent.id,
    }),
    number: t.exposeInt("number"),
    name: t.exposeString("name"),
    description: t.exposeString("description", { nullable: true }),
    date: t.field({
      type: "Date",
      resolve: (parent) => {
        return parent.date.toDate();
      },
    }),
    type: t.exposeString("type"),
    category: t.field({
      type: "UUID",
      resolve: (parent) => parent.category,
      nullable: true,
    }),
    subcategory: t.field({
      type: "UUID",
      resolve: (parent) => parent.subcategory,
      nullable: true,
    }),
    project: t.field({
      type: "UUID",
      resolve: (parent) => parent.project,
      nullable: true,
    }),
    amount: t.exposeFloat("amount"),
    status: t.exposeString("status"),
    transactions: t.field({
      type: [TransactionSchema],
      resolve: (parent) => parent.transactions,
    }),
    movements: t.field({
      type: [ActivityMovementSchema],
      resolve: (parent) => parent.movements,
    }),
  }),
});

export const ActivityMovementSchema =
  builder.objectRef<ActivityMovement>("ActivityMovement");

ActivityMovementSchema.implement({
  fields: (t) => ({
    id: t.field({
      type: "UUID",
      resolve: (parent) => parent.id,
    }),
    movement: t.field({
      type: "UUID",
      resolve: (parent) => parent.movement,
    }),
    amount: t.exposeFloat("amount"),
  }),
});

export const TransactionSchema = builder.objectRef<
  Transaction & { liabilities?: Liability[] }
>("Transaction");

TransactionSchema.implement({
  fields: (t) => ({
    id: t.field({
      type: "UUID",
      resolve: (parent) => parent.id,
    }),
    amount: t.exposeFloat("amount"),
    fromAccount: t.field({
      type: "UUID",
      nullable: true,
      resolve: (parent) => parent.fromAccount,
    }),
    fromUser: t.field({
      type: "UUID",
      nullable: true,
      resolve: (parent) => parent.fromUser,
    }),
    toAccount: t.field({
      type: "UUID",
      nullable: true,
      resolve: (parent) => parent.toAccount,
    }),
    toUser: t.field({
      type: "UUID",
      nullable: true,
      resolve: (parent) => parent.toUser,
    }),
  }),
});

export const ActivityCategorySchema =
  builder.objectRef<ActivityCategory>("ActivityCategory");

ActivityCategorySchema.implement({
  fields: (t) => ({
    id: t.field({
      type: "UUID",
      resolve: (parent) => parent.id,
    }),
    name: t.exposeString("name"),
    type: t.exposeString("type"),
  }),
});

export const ActivitySubCategorySchema = builder.objectRef<ActivitySubCategory>(
  "ActivitySubCategory",
);

ActivitySubCategorySchema.implement({
  fields: (t) => ({
    id: t.field({
      type: "UUID",
      resolve: (parent) => parent.id,
    }),
    name: t.exposeString("name"),
    category: t.field({
      type: "UUID",
      resolve: (parent) => parent.category,
    }),
  }),
});

export const DeleteActivityResponseSchema = builder.objectRef<{
  id: UUID;
  success: boolean;
}>("DeleteActivityResponse");

DeleteActivityResponseSchema.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    success: t.exposeBoolean("success"),
  }),
});

export const DeleteTransactionResponseSchema = builder.objectRef<{
  id: UUID;
  success: boolean;
}>("DeleteTransactionResponse");

DeleteTransactionResponseSchema.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    success: t.exposeBoolean("success"),
  }),
});
