import type { WorkflowMessage } from "@maille/core/workflows";
import type { Evidence } from "./evidence";
import type { LlmMessage } from "../llm";

/**
 * Pure prompt construction: shaping evidence and the workflow transcript
 * into the messages sent to the model.
 */

/** The opening task message: the movement, the evidence pack, the vocabulary. */
export const taskMessage = (evidence: Evidence, remainingToAllocate: number): LlmMessage => ({
  role: "user",
  content: JSON.stringify({
    movement: evidence.movement,
    remainingToAllocate,
    history: {
      similarMovements: evidence.similarMovements,
      activitiesByDateWindow: evidence.activitiesByDateWindow,
      activitiesByName: evidence.activitiesByName,
    },
    vocabulary: evidence.vocabulary,
  }),
});

/**
 * Flattens the workflow's stored transcript into LLM messages. Answer
 * options offered by the assistant are inlined into its content, since
 * chat-completions have no native representation for them.
 */
export const transcriptToLlmMessages = (messages: WorkflowMessage[]): LlmMessage[] =>
  messages
    .filter((message) => message.role !== "separator")
    .map((message) => {
      if (message.role === "assistant") {
        const options = message.options?.length
          ? ` Options: ${message.options.map((option) => option.label).join("; ")}`
          : "";
        return { role: "assistant" as const, content: `${message.content}${options}` };
      }
      return { role: "user" as const, content: message.content };
    });
