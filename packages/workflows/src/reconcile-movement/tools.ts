import { ActivityType } from "@maille/core/activities";
import { z } from "zod";
import type { LlmTool } from "../llm";

/**
 * The reconcile-movement workflow's tool contract with the model, plus the
 * argument schemas used to validate tool calls before execution. Pure: no
 * I/O, no state.
 */

export const SYSTEM_PROMPT = `You are Maille's AI assistant, a precise bookkeeping assistant operating on a strict double-entry ledger.
Your task: reconcile a bank movement by linking it to existing activities, or creating new ones.

Rules:
- The movement must end up fully allocated: the sum of link amounts must equal the movement amount exactly. Link amounts carry the movement's sign (negative for expenses).
- In most cases you should create a new activity. However, when there is an existing activity on the same day as the movement that clearly represents the same purpose (e.g. multiple card payments at the same bar on the same night), link to it instead of creating a duplicate.
- How similar movements were reconciled in the past is the strongest signal when deciding what type of activity to create. Follow it unless it contradicts the current movement.
- Never create an activity whose name already exists (case-insensitive); link to it instead (but only if it is not already reconciled and fits the movement).
- When you link a movement to an existing activity, the activity's transaction amount is automatically increased by the linked amount to keep the activity reconciled. You do not need to adjust transaction amounts yourself.
- A movement may be split across several activities when it bundles several purposes.
- If the evidence is ambiguous, ask the user one precise question with concrete options instead of guessing.
- If you have no reasonable clue, give up: a failed workflow is better than a wrong activity.
- Call exactly one tool per turn. IDs and dates are used exactly as given in the context. Amounts are plain numbers.
- When creating an activity, its date is automatically extracted from the movement name if it contains one (e.g. "CB 15/03/2024" → 2024-03-15); otherwise the movement date is used.
- Activity names must be purely descriptive text. Do not include dates, account numbers, or transaction references in the name — these belong in dedicated fields.
- Do not set a description that merely restates the payment (e.g. the movement name, the merchant, or the amount). Descriptions should add context that is not already obvious from the name or the movement data, or be left empty.`;

//
// Tool argument schemas
//

export const FindSimilarMovementsArgs = z.object({ name: z.string() });

export const SearchActivitiesArgs = z.object({
  name: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

export const LinkMovementArgs = z.object({ activityId: z.string(), amount: z.number() });

export const CreateActivityArgs = z.object({
  name: z.string(),
  type: z.enum(ActivityType),
  amount: z.number(),
  description: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  fromAccount: z.string().optional(),
  toAccount: z.string().optional(),
});

export const AskUserArgs = z.object({
  question: z.string(),
  options: z.array(z.object({ label: z.string() })).optional(),
});

export const GiveUpArgs = z.object({ reason: z.string().optional() });

export const RECONCILE_MOVEMENT_TOOLS: LlmTool[] = [
  {
    name: "findSimilarMovements",
    description:
      "Find past movements with a matching name (case-insensitive substring), including how each was linked to activities.",
    parameters: {
      type: "object",
      properties: { name: { type: "string", description: "Movement name or fragment" } },
      required: ["name"],
    },
  },
  {
    name: "searchActivities",
    description: "Search the user's activities by name and/or date window.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Activity name or fragment" },
        fromDate: { type: "string", description: "ISO date, lower bound (inclusive)" },
        toDate: { type: "string", description: "ISO date, upper bound (inclusive)" },
      },
    },
  },
  {
    name: "linkMovement",
    description:
      "Link the movement to an existing activity for the given amount (carries the movement's sign). Use for the whole remaining amount, or a part of it when splitting.",
    parameters: {
      type: "object",
      properties: {
        activityId: { type: "string", description: "Existing activity id" },
        amount: { type: "number", description: "Link amount, same sign as the movement" },
      },
      required: ["activityId", "amount"],
    },
  },
  {
    name: "createActivity",
    description:
      "Create a new activity and link the movement to it for the given amount. Refused if an activity with the same name already exists.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        type: { type: "string", enum: Object.values(ActivityType) },
        amount: { type: "number", description: "Link amount, same sign as the movement" },
        description: { type: "string" },
        category: { type: "string", description: "Category id from the vocabulary" },
        subcategory: { type: "string", description: "Subcategory id from the vocabulary" },
        fromAccount: {
          type: "string",
          description: "Override the default source account id (optional)",
        },
        toAccount: {
          type: "string",
          description: "Override the default destination account id (optional)",
        },
      },
      required: ["name", "type", "amount"],
    },
  },
  {
    name: "askUser",
    description:
      "Ask the user a question and pause the workflow. Provide concrete options when possible.",
    parameters: {
      type: "object",
      properties: {
        question: { type: "string" },
        options: {
          type: "array",
          items: { type: "object", properties: { label: { type: "string" } }, required: ["label"] },
        },
      },
      required: ["question"],
    },
  },
  {
    name: "giveUp",
    description: "Give up reconciling this movement; it needs manual review.",
    parameters: {
      type: "object",
      properties: { reason: { type: "string" } },
    },
  },
];
