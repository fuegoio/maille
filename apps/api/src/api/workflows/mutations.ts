import { builder } from "../builder";
import { MovementWorkflowSchema } from "./schemas";
import { isHarnessConfigured } from "@/harness/config";
import { enqueueWorkflow } from "@/harness/queue";
import { answerWorkflow, serializeWorkflow, triggerWorkflow } from "@/harness/store";
import { GraphQLError } from "graphql";

export const registerWorkflowsMutations = () => {
  builder.mutationField("triggerWorkflow", (t) =>
    t.field({
      type: MovementWorkflowSchema,
      args: {
        movementId: t.arg({ type: "String" }),
      },
      description:
        "Runs (or re-runs) the movement's unique workflow. Creates it if missing, resets failed/cancelled workflows, no-op otherwise.",
      resolve: async (root, args, ctx) => {
        if (!isHarnessConfigured()) {
          throw new GraphQLError("The AI harness is not configured (MISTRAL_API_KEY missing)");
        }

        const row = await triggerWorkflow(ctx.user.id, args.movementId, ctx.session.id);
        if (row.status === "queued") {
          enqueueWorkflow(row.id, row.user);
        }
        return serializeWorkflow(row);
      },
    }),
  );

  builder.mutationField("answerWorkflow", (t) =>
    t.field({
      type: MovementWorkflowSchema,
      args: {
        id: t.arg({ type: "String" }),
        content: t.arg.string(),
        optionId: t.arg({ type: "String", required: false }),
      },
      description: "Answers the workflow's pending question and resumes the run.",
      resolve: async (root, args, ctx) => {
        const row = await answerWorkflow(
          ctx.user.id,
          args.id,
          args.content,
          args.optionId ?? null,
          ctx.session.id,
        );
        enqueueWorkflow(row.id, row.user);
        return serializeWorkflow(row);
      },
    }),
  );
};
