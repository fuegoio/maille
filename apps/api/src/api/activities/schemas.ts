import { builder } from "@/api/builder";
import type {
  Activity,
  Transaction,
  ActivityMovement,
  ActivityCategory,
  ActivitySubCategory,
  ActivityLiability,
} from "@maille/core/activities";

export const ActivitySchema = builder.objectRef<Activity>("Activity");

ActivitySchema.implement({
  fields: (t) => ({
    id: t.field({
      type: "String",
      resolve: (parent) => parent.id,
    }),
    users: t.field({
      type: ["String"],
      resolve: (parent) => parent.users,
    }),
    number: t.exposeInt("number"),
    name: t.exposeString("name"),
    description: t.exposeString("description", { nullable: true }),
    date: t.field({
      type: "Date",
      resolve: (parent) => {
        return parent.date;
      },
    }),
    type: t.exposeString("type"),
    category: t.field({
      type: "String",
      resolve: (parent) => parent.category,
      nullable: true,
    }),
    subcategory: t.field({
      type: "String",
      resolve: (parent) => parent.subcategory,
      nullable: true,
    }),
    project: t.field({
      type: "String",
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
    liabilities: t.field({
      type: [ActivityLiabilitySchema],
      resolve: (parent) => parent.liabilities,
    }),
  }),
});

export const ActivityMovementSchema = builder.objectRef<ActivityMovement>("ActivityMovement");

ActivityMovementSchema.implement({
  fields: (t) => ({
    id: t.field({
      type: "String",
      resolve: (parent) => parent.id,
    }),
    movement: t.field({
      type: "String",
      resolve: (parent) => parent.movement,
    }),
    amount: t.exposeFloat("amount"),
  }),
});

export const ActivityLiabilitySchema = builder.objectRef<ActivityLiability>("ActivityLiability");

ActivityLiabilitySchema.implement({
  fields: (t) => ({
    user: t.field({
      type: "String",
      resolve: (parent) => parent.user,
    }),
    amount: t.exposeFloat("amount"),
  }),
});

export const TransactionSchema = builder.objectRef<Transaction>("Transaction");

TransactionSchema.implement({
  fields: (t) => ({
    id: t.field({
      type: "String",
      resolve: (parent) => parent.id,
    }),
    user: t.field({
      type: "String",
      resolve: (parent) => parent.user,
    }),
    amount: t.exposeFloat("amount"),
    fromAccount: t.field({
      type: "String",
      resolve: (parent) => parent.fromAccount,
    }),
    fromAsset: t.field({
      type: "String",
      nullable: true,
      resolve: (parent) => parent.fromAsset,
    }),
    fromCounterparty: t.field({
      type: "String",
      nullable: true,
      resolve: (parent) => parent.fromCounterparty,
    }),
    toAccount: t.field({
      type: "String",
      resolve: (parent) => parent.toAccount,
    }),
    toAsset: t.field({
      type: "String",
      nullable: true,
      resolve: (parent) => parent.toAsset,
    }),
    toCounterparty: t.field({
      type: "String",
      nullable: true,
      resolve: (parent) => parent.toCounterparty,
    }),
  }),
});

export const ActivityCategorySchema = builder.objectRef<ActivityCategory>("ActivityCategory");

ActivityCategorySchema.implement({
  fields: (t) => ({
    id: t.field({
      type: "String",
      resolve: (parent) => parent.id,
    }),
    name: t.exposeString("name"),
    type: t.exposeString("type"),
  }),
});

export const ActivitySubCategorySchema =
  builder.objectRef<ActivitySubCategory>("ActivitySubCategory");

ActivitySubCategorySchema.implement({
  fields: (t) => ({
    id: t.field({
      type: "String",
      resolve: (parent) => parent.id,
    }),
    name: t.exposeString("name"),
    category: t.field({
      type: "String",
      resolve: (parent) => parent.category,
    }),
  }),
});

export const DeleteActivityResponseSchema = builder.objectRef<{
  id: string;
  success: boolean;
}>("DeleteActivityResponse");

DeleteActivityResponseSchema.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    success: t.exposeBoolean("success"),
  }),
});

export const DeleteTransactionResponseSchema = builder.objectRef<{
  id: string;
  success: boolean;
}>("DeleteTransactionResponse");

DeleteTransactionResponseSchema.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    success: t.exposeBoolean("success"),
  }),
});
