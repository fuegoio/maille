import postgres from "postgres";

/**
 * E2E test infrastructure. This module deliberately imports nothing from the
 * application: tests must set the environment (DATABASE_URL, harness
 * settings, the mock Mistral URL) BEFORE importing app modules, which are
 * then imported dynamically from the test file.
 */

export const ADMIN_DATABASE_URL =
  process.env.TEST_DATABASE_ADMIN_URL ?? "postgres://postgres:postgres@localhost:5432/postgres";

/** Creates a fresh test database, dropping any previous one. */
export async function createTestDatabase(): Promise<string> {
  const dbName = `maille_harness_test_${crypto.randomUUID().replaceAll("-", "")}`;
  const admin = postgres(ADMIN_DATABASE_URL, { max: 1 });
  try {
    await admin`DROP DATABASE IF EXISTS ${admin(dbName)}`;
    await admin`CREATE DATABASE ${admin(dbName)}`;
  } finally {
    await admin.end();
  }
  return dbName;
}

/** Drops the test database (best-effort), terminating any lingering connections. */
export async function dropTestDatabase(dbName: string): Promise<void> {
  const admin = postgres(ADMIN_DATABASE_URL, { max: 1 });
  try {
    await admin`SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = ${dbName} AND pid <> pg_backend_pid()`;
    await admin`DROP DATABASE IF EXISTS ${admin(dbName)}`;
  } catch {
    // best-effort cleanup
  } finally {
    await admin.end();
  }
}

/** A body received by the mock Mistral server. */
export type MistralRequest = {
  model: string;
  messages: {
    role: string;
    content: string | null;
    tool_calls?: { id: string; type: string; function: { name: string; arguments: string } }[];
    tool_call_id?: string;
  }[];
  tools: { type: string; function: { name: string } }[];
};

export type ScriptedResponse = (
  | { body: Record<string, unknown> }
  | { status: number; body: Record<string, unknown> }
) & { calls?: number };

/**
 * Scripted, capturing mock of the Mistral chat completions API. Responses
 * are consumed in order; when the queue is empty the server answers 500
 * (which exercises the provider-error path).
 */
export class MockMistral {
  readonly server: ReturnType<typeof Bun.serve>;
  private queue: ((request: MistralRequest) => ScriptedResponse)[] = [];
  requests: MistralRequest[] = [];
  authorizations: (string | null)[] = [];

  constructor() {
    this.server = Bun.serve({
      port: 0,
      fetch: async (request) => {
        const body = (await request.json()) as MistralRequest;
        this.requests.push(body);
        this.authorizations.push(request.headers.get("authorization"));
        const next = this.queue.shift();
        if (!next) {
          return Response.json(
            { message: "MockMistral has no scripted response" },
            { status: 500 },
          );
        }
        const response = next(body);
        if ("status" in response && response.status !== 200) {
          return Response.json(response.body, { status: response.status });
        }
        return Response.json(response.body);
      },
    });
  }

  /** Base URL to configure as HARNESS_LLM_BASE_URL. */
  url(): string {
    return `http://localhost:${this.server.port}/v1`;
  }

  enqueue(response: ScriptedResponse | ((request: MistralRequest) => ScriptedResponse)): void {
    this.queue.push(typeof response === "function" ? response : () => response);
  }

  reset(): void {
    this.queue = [];
    this.requests = [];
    this.authorizations = [];
  }

  stop(): void {
    this.server.stop(true);
  }
}

/** A scripted assistant turn calling exactly one tool. */
export const toolCallResponse = (name: string, args: unknown, content: string | null = null) => ({
  body: {
    choices: [
      {
        message: {
          role: "assistant",
          content,
          tool_calls: [
            {
              id: crypto.randomUUID(),
              type: "function",
              function: { name, arguments: JSON.stringify(args) },
            },
          ],
        },
      },
    ],
  },
});

/** A scripted assistant turn with plain text (no tool call). */
export const textResponse = (content: string) => ({
  body: {
    choices: [{ message: { role: "assistant", content } }],
  },
});
