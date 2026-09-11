import type {
  CreateWorkflowEvent,
  UpdateWorkflowEvent,
} from "@maille/core/sync";

import { graphql } from "@/gql";

import type { MutationType } from "./type";

export const triggerWorkflowMutation = graphql(/* GraphQL */ `
  mutation TriggerWorkflow($movementId: String!, $message: String) {
    triggerWorkflow(movementId: $movementId, message: $message) {
      id
      movement
      status
      trigger
      attempts
      messages {
        id
        role
        content
        options {
          id
          label
        }
        optionId
        createdAt
      }
      result
      error
      createdAt
      updatedAt
    }
  }
`);

export const answerWorkflowMutation = graphql(/* GraphQL */ `
  mutation AnswerWorkflow($id: String!, $content: String!, $optionId: String) {
    answerWorkflow(id: $id, content: $content, optionId: $optionId) {
      id
      movement
      status
      trigger
      attempts
      messages {
        id
        role
        content
        options {
          id
          label
        }
        optionId
        createdAt
      }
      result
      error
      createdAt
      updatedAt
    }
  }
`);

export type TriggerWorkflowMutation = MutationType<
  "triggerWorkflow",
  typeof triggerWorkflowMutation,
  undefined,
  [CreateWorkflowEvent]
> & {
  /**
   * Whether the workflow tab opens when the mutation succeeds.
   * Palettes and context menus set this to false.
   */
  openOnStart?: boolean;
};

export type AnswerWorkflowMutation = MutationType<
  "answerWorkflow",
  typeof answerWorkflowMutation,
  undefined,
  [UpdateWorkflowEvent]
>;

export type WorkflowMutation = TriggerWorkflowMutation | AnswerWorkflowMutation;
