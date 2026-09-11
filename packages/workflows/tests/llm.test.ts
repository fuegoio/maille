import { describe, expect, it } from "vitest";

import { chatCompletion, LlmError, type LlmMessage, type LlmTool } from "../src/llm";

const TOOLS: LlmTool[] = [
  {
    name: "linkMovement",
    description: "Links the movement",
    parameters: {
      type: "object",
      properties: {
        activityId: { type: "string" },
        amount: { type: "number" },
      },
      required: ["activityId", "amount"],
    },
  },
];

const toolCallBody = (name: string, args: unknown, content: string | null = null) => ({
  choices: [
    {
      message: {
        role: "assistant",
        content,
        tool_calls: [
          {
            id: "call-1",
            type: "function",
            function: { name, arguments: JSON.stringify(args) },
          },
        ],
      },
    },
  ],
  usage: { prompt_tokens: 100, completion_tokens: 20 },
});

const lastRequest = (calls: { url: string; init: RequestInit }[]) => calls[calls.length - 1]!;

describe("chatCompletion request mapping", () => {
  it("posts an OpenAI-compatible body with model, tools and messages", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const messages: LlmMessage[] = [
      { role: "system", content: "You are the AI assistant" },
      { role: "user", content: "Reconcile this movement" },
    ];

    const result = await chatCompletion({
      baseUrl: "https://api.mistral.ai/v1/",
      apiKey: "test-key",
      model: "z-ai-glm-5-3",
      messages,
      tools: TOOLS,
      timeoutMs: 5000,
      fetchFn: async (url: string, init: RequestInit) => {
        calls.push({ url, init });
        return new Response(
          JSON.stringify({
            choices: [{ message: { role: "assistant", content: "hello", tool_calls: [] } }],
          }),
          { status: 200 },
        );
      },
    });

    const request = lastRequest(calls);
    expect(request.url).toBe("https://api.mistral.ai/v1/chat/completions");
    expect(new Headers(request.init.headers).get("authorization")).toBe("Bearer test-key");

    const body = JSON.parse(request.init.body as string);
    expect(body.model).toBe("z-ai-glm-5-3");
    expect(body.tool_choice).toBe("auto");
    expect(body.tools).toEqual([
      {
        type: "function",
        function: {
          name: "linkMovement",
          description: "Links the movement",
          parameters: {
            type: "object",
            properties: { activityId: { type: "string" }, amount: { type: "number" } },
            required: ["activityId", "amount"],
          },
        },
      },
    ]);
    expect(body.messages).toEqual([
      { role: "system", content: "You are the AI assistant" },
      { role: "user", content: "Reconcile this movement" },
    ]);
    expect(result.content).toBe("hello");
    expect(result.toolCalls).toEqual([]);
  });

  it("omits tools and tool_choice from the body when none are given", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const messages: LlmMessage[] = [
      { role: "system", content: "You are the AI assistant" },
      { role: "user", content: "Why was this categorized as rent?" },
    ];

    const result = await chatCompletion({
      baseUrl: "https://api.mistral.ai/v1",
      apiKey: "test-key",
      model: "z-ai-glm-5-3",
      messages,
      timeoutMs: 5000,
      fetchFn: async (url: string, init: RequestInit) => {
        calls.push({ url, init });
        return new Response(
          JSON.stringify({
            choices: [{ message: { role: "assistant", content: "Because the name matches" } }],
          }),
          { status: 200 },
        );
      },
    });

    const body = JSON.parse(lastRequest(calls).init.body as string);
    expect(body.tools).toBeUndefined();
    expect(body.tool_choice).toBeUndefined();
    expect(body.messages).toEqual(messages);
    expect(result.content).toBe("Because the name matches");
  });

  it("maps assistant tool calls and tool results to the wire format", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const messages: LlmMessage[] = [
      {
        role: "assistant",
        content: null,
        toolCalls: [
          { id: "call-9", name: "linkMovement", args: { activityId: "abc", amount: -1 } },
        ],
      },
      { role: "tool", toolCallId: "call-9", content: '{"ok":true}' },
    ];

    await chatCompletion({
      baseUrl: "http://mock/v1",
      apiKey: "k",
      model: "m",
      messages: [{ role: "user", content: "go" }, ...messages],
      tools: TOOLS,
      timeoutMs: 5000,
      fetchFn: async (url: string, init: RequestInit) => {
        calls.push({ url, init });
        return new Response(
          JSON.stringify({
            choices: [{ message: { role: "assistant", content: null, tool_calls: [] } }],
          }),
          { status: 200 },
        );
      },
    });

    const body = JSON.parse(lastRequest(calls).init.body as string);
    expect(body.messages).toEqual([
      { role: "user", content: "go" },
      {
        role: "assistant",
        content: null,
        tool_calls: [
          {
            id: "call-9",
            type: "function",
            function: { name: "linkMovement", arguments: '{"activityId":"abc","amount":-1}' },
          },
        ],
      },
      { role: "tool", tool_call_id: "call-9", content: '{"ok":true}' },
    ]);
  });
});

describe("chatCompletion response parsing", () => {
  const fetchReturning =
    (body: unknown, status = 200) =>
    async () =>
      new Response(JSON.stringify(body), { status });

  it("parses tool calls with JSON arguments", async () => {
    const result = await chatCompletion({
      baseUrl: "http://mock/v1",
      apiKey: "k",
      model: "m",
      messages: [{ role: "user", content: "go" }],
      tools: TOOLS,
      timeoutMs: 5000,
      fetchFn: fetchReturning(toolCallBody("linkMovement", { activityId: "a1", amount: -12.99 })),
    });

    expect(result.content).toBeNull();
    expect(result.toolCalls).toEqual([
      { id: "call-1", name: "linkMovement", args: { activityId: "a1", amount: -12.99 } },
    ]);
    expect(result.usage).toEqual({ promptTokens: 100, completionTokens: 20 });
  });

  it("throws on invalid tool arguments JSON", async () => {
    const body = {
      choices: [
        {
          message: {
            role: "assistant",
            content: null,
            tool_calls: [
              { id: "c", type: "function", function: { name: "linkMovement", arguments: "{" } },
            ],
          },
        },
      ],
    };
    await expect(
      chatCompletion({
        baseUrl: "http://mock/v1",
        apiKey: "k",
        model: "m",
        messages: [{ role: "user", content: "go" }],
        tools: TOOLS,
        timeoutMs: 5000,
        fetchFn: fetchReturning(body),
      }),
    ).rejects.toThrow(LlmError);
  });

  it("surfaces provider errors with the status", async () => {
    await expect(
      chatCompletion({
        baseUrl: "http://mock/v1",
        apiKey: "k",
        model: "m",
        messages: [{ role: "user", content: "go" }],
        tools: TOOLS,
        timeoutMs: 5000,
        fetchFn: async () => new Response("rate limited", { status: 429 }),
      }),
    ).rejects.toThrow("429");
  });

  it("rejects malformed responses", async () => {
    await expect(
      chatCompletion({
        baseUrl: "http://mock/v1",
        apiKey: "k",
        model: "m",
        messages: [{ role: "user", content: "go" }],
        tools: TOOLS,
        timeoutMs: 5000,
        fetchFn: fetchReturning({ nope: true }),
      }),
    ).rejects.toThrow(/malformed/i);

    await expect(
      chatCompletion({
        baseUrl: "http://mock/v1",
        apiKey: "k",
        model: "m",
        messages: [],
        tools: TOOLS,
        timeoutMs: 5000,
        fetchFn: fetchReturning({}),
      }),
    ).rejects.toThrow(/at least one message/i);
  });

  it("wraps timeouts as LlmError with the abort cause", async () => {
    const result = chatCompletion({
      baseUrl: "http://mock/v1",
      apiKey: "k",
      model: "m",
      messages: [{ role: "user", content: "go" }],
      tools: TOOLS,
      timeoutMs: 10,
      fetchFn: async (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () =>
            reject(new DOMException("The operation was aborted", "TimeoutError")),
          );
        }),
    });

    const error = (await result.then(
      () => null,
      (e: unknown) => e,
    )) as LlmError;
    expect(error).toBeInstanceOf(LlmError);
    expect(error.message).toMatch(/request failed/i);
    expect((error.cause as Error).name).toBe("TimeoutError");
  });
});
