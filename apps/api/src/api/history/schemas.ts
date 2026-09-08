import { builder } from "@/api/builder";
import type { SerializedHistoryEntry } from "@maille/core/history";

export const HistoryEntrySchema = builder.objectRef<SerializedHistoryEntry>("HistoryEntry");

HistoryEntrySchema.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    entityType: t.exposeString("entityType"),
    entityId: t.exposeString("entityId"),
    action: t.exposeString("action"),
    subject: t.field({
      type: "String",
      nullable: true,
      resolve: (parent) => (parent.subject ? JSON.stringify(parent.subject) : null),
    }),
    changes: t.field({
      type: "String",
      resolve: (parent) => JSON.stringify(parent.changes),
    }),
    createdAt: t.field({
      type: "Float",
      resolve: (parent) => new Date(parent.createdAt).getTime() / 1000,
    }),
    user: t.exposeString("user"),
    clientId: t.exposeString("clientId"),
  }),
});
