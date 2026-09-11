import { z } from "zod";

/**
 * Minimal client for the Mistral chat completions API with tool calling.
 *
 * The wire format is the OpenAI-compatible subset served by
 * `https://api.mistral.ai/v1/chat/completions`. Everything (base URL, key,
 * model, fetch) is passed explicitly by the caller so tests can point the
 * client at a mock server.
 */

export type LlmTool = {
  name: string;
  description: string;
  /** JSON schema describing the tool's arguments. */
  parameters: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
};

export type LlmToolCall = {
  id: string;
  name: string;
  args: Record<string, unknown>;
};

export type LlmMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string | null; toolCalls?: LlmToolCall[] }
  | { role: "tool"; toolCallId: string; content: string };

export type LlmUsage = {
  promptTokens: number | null;
  completionTokens: number | null;
};

export class LlmError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    override readonly cause?: unknown,
  ) {
    super(message);
    this.name = "LlmError";
  }
}

/** Minimal fetch shape, so tests can inject plain request handlers. */
export type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

export type ChatCompletionParams = {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: LlmMessage[];
  /** Tool contract; omitted for plain conversational turns. */
  tools?: LlmTool[];
  timeoutMs: number;
  /** Force a specific tool by name; defaults to model choice ("auto"). */
  toolChoice?: string;
  fetchFn?: FetchLike;
};

export type ChatCompletionResult = {
  content: string | null;
  toolCalls: LlmToolCall[];
  usage: LlmUsage;
};

const WireToolCallSchema = z.object({
  id: z.string(),
  type: z.string(),
  function: z.object({
    name: z.string(),
    arguments: z.string(),
  }),
});

const WireResponseSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({
          role: z.string(),
          content: z.string().nullable().optional(),
          tool_calls: z.array(WireToolCallSchema).optional(),
        }),
      }),
    )
    .min(1),
  usage: z
    .object({
      prompt_tokens: z.number().optional(),
      completion_tokens: z.number().optional(),
    })
    .optional(),
});

type WireMessage =
  | { role: "system" | "user" | "assistant"; content: string | null }
  | { role: "assistant"; content: string | null; tool_calls: unknown[] }
  | { role: "tool"; tool_call_id: string; content: string };

const toWireMessage = (message: LlmMessage): WireMessage => {
  switch (message.role) {
    case "system":
    case "user":
      return { role: message.role, content: message.content };
    case "assistant":
      return {
        role: "assistant",
        content: message.content,
        ...(message.toolCalls?.length
          ? {
              tool_calls: message.toolCalls.map((call) => ({
                id: call.id,
                type: "function",
                function: {
                  name: call.name,
                  arguments: JSON.stringify(call.args),
                },
              })),
            }
          : {}),
      };
    case "tool":
      return { role: "tool", tool_call_id: message.toolCallId, content: message.content };
  }
};

const parseToolArguments = (raw: string): Record<string, unknown> => {
  try {
    const parsed = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("not an object");
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new LlmError(`LLM returned invalid tool arguments: ${raw}`);
  }
};

export async function chatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResult> {
  const { baseUrl, apiKey, model, messages, tools, timeoutMs, fetchFn = fetch } = params;

  if (messages.length === 0) {
    throw new LlmError("LLM conversation requires at least one message");
  }

  let response: Response;
  try {
    response = await fetchFn(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: messages.map(toWireMessage),
        ...(tools?.length
          ? {
              tools: tools.map((tool) => ({
                type: "function",
                function: {
                  name: tool.name,
                  description: tool.description,
                  parameters: tool.parameters,
                },
              })),
              tool_choice: params.toolChoice
                ? { type: "function", function: { name: params.toolChoice } }
                : "auto",
            }
          : {}),
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    throw new LlmError(`LLM request failed: ${error}`, undefined, error);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new LlmError(
      `LLM provider returned ${response.status}: ${body.slice(0, 500)}`,
      response.status,
    );
  }

  const json = await response.json().catch(() => {
    throw new LlmError("LLM provider returned a non-JSON body");
  });
  const parsed = WireResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new LlmError(`Malformed LLM response: ${JSON.stringify(json).slice(0, 500)}`);
  }

  const message = parsed.data.choices[0]!.message;
  const toolCalls = (message.tool_calls ?? []).map((call) => ({
    id: call.id,
    name: call.function.name,
    args: parseToolArguments(call.function.arguments),
  }));

  return {
    content: message.content ?? null,
    toolCalls,
    usage: {
      promptTokens: parsed.data.usage?.prompt_tokens ?? null,
      completionTokens: parsed.data.usage?.completion_tokens ?? null,
    },
  };
}
