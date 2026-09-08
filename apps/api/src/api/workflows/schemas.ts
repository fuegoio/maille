import { builder } from "@/api/builder";
import type { MovementWorkflow, WorkflowMessage } from "@maille/core/harness";

export const WorkflowMessageOptionSchema = builder.objectRef<{
  id: string;
  label: string;
}>("WorkflowMessageOption");

WorkflowMessageOptionSchema.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    label: t.exposeString("label"),
  }),
});

export const WorkflowMessageSchema = builder.objectRef<WorkflowMessage>("WorkflowMessage");

WorkflowMessageSchema.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    role: t.exposeString("role"),
    content: t.exposeString("content"),
    options: t.field({
      type: [WorkflowMessageOptionSchema],
      nullable: true,
      resolve: (parent) => parent.options ?? null,
    }),
    optionId: t.field({
      type: "String",
      nullable: true,
      resolve: (parent) => parent.optionId ?? null,
    }),
    createdAt: t.field({
      type: "Float",
      resolve: (parent) => new Date(parent.createdAt).getTime() / 1000,
    }),
  }),
});

export const MovementWorkflowSchema = builder.objectRef<MovementWorkflow>("MovementWorkflow");

MovementWorkflowSchema.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    movement: t.exposeString("movement"),
    status: t.exposeString("status"),
    trigger: t.exposeString("trigger"),
    attempts: t.exposeInt("attempts"),
    messages: t.field({
      type: [WorkflowMessageSchema],
      resolve: (parent) => parent.messages,
    }),
    result: t.field({
      type: "String",
      nullable: true,
      resolve: (parent) => (parent.result ? JSON.stringify(parent.result) : null),
    }),
    error: t.field({
      type: "String",
      nullable: true,
      resolve: (parent) => parent.error,
    }),
    createdAt: t.field({
      type: "Float",
      resolve: (parent) => new Date(parent.createdAt).getTime() / 1000,
    }),
    updatedAt: t.field({
      type: "Float",
      resolve: (parent) => new Date(parent.updatedAt).getTime() / 1000,
    }),
  }),
});
