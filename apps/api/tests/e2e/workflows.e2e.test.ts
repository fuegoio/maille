import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { eq } from "drizzle-orm";
import {
  MockMistral,
  createTestDatabase,
  dropTestDatabase,
  textResponse,
  toolCallResponse,
} from "./helpers";

/**
 * End-to-end tests for the AI workflows: the full API boots against a real
 * Postgres database and only the Mistral API is mocked (WORKFLOWS_LLM_BASE_URL
 * points at MockMistral).
 */

//
// Environment must be set before importing app modules.
//

const mockMistral = new MockMistral();
const databaseName = await createTestDatabase();

process.env.DATABASE_URL = `postgres://postgres:postgres@localhost:5432/${databaseName}`;
process.env.GOOGLE_CLIENT_ID = "test-client-id";
process.env.GOOGLE_CLIENT_SECRET = "test-secret";
process.env.LOG_LEVEL = "silent";
process.env.MISTRAL_API_KEY = "test-key";
process.env.WORKFLOWS_LLM_BASE_URL = mockMistral.url();
process.env.WORKFLOWS_LLM_MODEL = "glm-5-2";
process.env.WORKFLOWS_MAX_ATTEMPTS = "2";
process.env.WORKFLOWS_RETRY_DELAY_MS = "30";
process.env.WORKFLOWS_TIMEOUT_MS = "5000";

const { migrate } = await import("drizzle-orm/postgres-js/migrator");
const { db } = await import("@/database");
const { startServer } = await import("@/server");
const { startWorkflows } = await import("@/workflows/queue");
const { movementsActivities, movementWorkflows, movements } = await import("@/tables");

await migrate(db, {
  migrationsFolder: fileURLToPath(new URL("../../drizzle", import.meta.url)),
});
const server = startServer(0);
const baseUrl = `http://localhost:${server.port}`;
await startWorkflows();

afterAll(async () => {
  server.stop(true);
  mockMistral.stop();
  await dropTestDatabase(databaseName);
});

beforeEach(() => {
  mockMistral.reset();
});

//
// Test helpers
//

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type TestUser = {
  userId: string;
  token: string;
  bankAccountId: string;
  expenseAccountId: string;
  revenueAccountId: string;
  investmentAccountId: string;
};

const signUp = async (): Promise<{ userId: string; token: string }> => {
  const response = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Workflow Tester",
      email: `workflow-${crypto.randomUUID()}@test.maille.dev`,
      password: "Password123!",
    }),
  });
  if (!response.ok) {
    throw new Error(`sign-up failed: ${response.status} ${await response.text()}`);
  }
  const body = (await response.json()) as { user?: { id?: string }; token?: string };
  const token = response.headers.get("set-auth-token") ?? body.token;
  if (!token || !body.user?.id) {
    throw new Error(`sign-up response missing token or user: ${JSON.stringify(body)}`);
  }
  return { userId: body.user.id, token };
};

const gql = async <T>(
  token: string,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> => {
  const response = await fetch(`${baseUrl}/graphql`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ query, variables }),
  });
  const body = (await response.json()) as { data?: T; errors?: { message: string }[] };
  if (body.errors?.length) {
    throw new Error(`GraphQL error: ${body.errors[0]?.message}`);
  }
  return body.data as T;
};

const CREATE_ACCOUNT = /* GraphQL */ `
  mutation CreateAccount($id: String!, $name: String!, $type: String!, $movements: Boolean) {
    createAccount(id: $id, name: $name, type: $type, movements: $movements) {
      id
      type
    }
  }
`;

const createUser = async (): Promise<TestUser> => {
  const { userId, token } = await signUp();
  const mkAccount = (name: string, type: string, withMovements = false) =>
    gql<{ createAccount: { id: string } }>(token, CREATE_ACCOUNT, {
      id: crypto.randomUUID(),
      name,
      type,
      movements: withMovements,
    }).then((data) => data.createAccount.id);

  const [bankAccountId, expenseAccountId, revenueAccountId, investmentAccountId] =
    await Promise.all([
      mkAccount("Checking", "bank_account", true),
      mkAccount("Expenses", "expense"),
      mkAccount("Income", "revenue"),
      mkAccount("Broker", "investment_account"),
    ]);

  return {
    userId,
    token,
    bankAccountId,
    expenseAccountId,
    revenueAccountId,
    investmentAccountId,
  };
};

const CREATE_MOVEMENT = /* GraphQL */ `
  mutation CreateMovement($id: String!, $name: String!, $date: Date!, $amount: Float!, $account: String!) {
    createMovement(id: $id, name: $name, date: $date, amount: $amount, account: $account) {
      id
      status
      workflow {
        id
        status
        trigger
      }
    }
  }
`;

const createMovement = async (
  user: TestUser,
  name: string,
  amount: number,
  date = "2026-09-01",
): Promise<string> => {
  const data = await gql<{ createMovement: { id: string } }>(user.token, CREATE_MOVEMENT, {
    id: crypto.randomUUID(),
    name,
    date,
    amount,
    account: user.bankAccountId,
  });
  return data.createMovement.id;
};

const triggerWorkflowOnMovement = async (
  user: TestUser,
  movementId: string,
  message?: string,
): Promise<string> => {
  const data = await gql<{ triggerWorkflow: { id: string } }>(
    user.token,
    TRIGGER_WORKFLOW,
    message ? { movementId, message } : { movementId },
  );
  return data.triggerWorkflow.id;
};

const MOVEMENT_QUERY = /* GraphQL */ `
  query Movement {
    movements {
      id
      name
      amount
      status
      activities {
        id
        activity
        amount
      }
      workflow {
        id
        status
        trigger
        attempts
        error
        messages {
          id
          role
          content
          options {
            id
            label
          }
          optionId
        }
        result
      }
    }
  }
`;

const queryMovements = async (user: TestUser) =>
  gql<{
    movements: {
      id: string;
      name: string;
      amount: number;
      status: "incomplete" | "completed";
      activities: { id: string; activity: string; amount: number }[];
      workflow: {
        id: string;
        status: string;
        trigger: string;
        attempts: number;
        error: string | null;
        messages: {
          id: string;
          role: string;
          content: string;
          options: { id: string; label: string }[] | null;
          optionId: string | null;
        }[];
        result: string | null;
      } | null;
    }[];
  }>(user.token, MOVEMENT_QUERY, {});

const ACTIVITIES_QUERY = /* GraphQL */ `
  query Activities {
    activities {
      id
      name
      type
      date
      movements {
        id
        movement
        amount
      }
    }
  }
`;

const queryActivities = async (user: TestUser) =>
  gql<{
    activities: {
      id: string;
      name: string;
      type: string;
      movements: { id: string; movement: string; amount: number }[];
    }[];
  }>(user.token, ACTIVITIES_QUERY, {});

const EVENTS_QUERY = /* GraphQL */ `
  query Events($lastSync: Float!) {
    events(lastSync: $lastSync) {
      type
      payload
      clientId
    }
  }
`;

const queryEvents = async (user: TestUser) =>
  gql<{ events: { type: string; payload: string; clientId: string }[] }>(user.token, EVENTS_QUERY, {
    lastSync: 0,
  });

const CREATE_ACTIVITY = /* GraphQL */ `
  mutation CreateActivity(
    $id: String!
    $name: String!
    $date: Date!
    $type: String!
    $transactions: [TransactionInput!]
  ) {
    createActivity(id: $id, name: $name, date: $date, type: $type, transactions: $transactions) {
      id
    }
  }
`;

const createActivityManually = async (
  user: TestUser,
  name: string,
  amount: number,
): Promise<string> => {
  const data = await gql<{ createActivity: { id: string } }>(user.token, CREATE_ACTIVITY, {
    id: crypto.randomUUID(),
    name,
    date: "2026-09-01",
    type: "expense",
    transactions: [
      {
        id: crypto.randomUUID(),
        amount: Math.abs(amount),
        fromAccount: user.bankAccountId,
        toAccount: user.expenseAccountId,
      },
    ],
  });
  return data.createActivity.id;
};

const LINK_MOVEMENT = /* GraphQL */ `
  mutation LinkMovement($id: String!, $movementId: String!, $activityId: String!, $amount: Float!) {
    createMovementActivity(id: $id, movementId: $movementId, activityId: $activityId, amount: $amount) {
      id
    }
  }
`;

const linkMovementManually = async (
  user: TestUser,
  movementId: string,
  activityId: string,
  amount: number,
) =>
  gql(user.token, LINK_MOVEMENT, {
    id: crypto.randomUUID(),
    movementId,
    activityId,
    amount,
  });

const TRIGGER_WORKFLOW = /* GraphQL */ `
  mutation TriggerWorkflow($movementId: String!, $message: String) {
    triggerWorkflow(movementId: $movementId, message: $message) {
      id
      status
    }
  }
`;

const ANSWER_WORKFLOW = /* GraphQL */ `
  mutation AnswerWorkflow($id: String!, $content: String!, $optionId: String) {
    answerWorkflow(id: $id, content: $content, optionId: $optionId) {
      id
      status
    }
  }
`;

type WorkflowRow = typeof movementWorkflows.$inferSelect;

const getWorkflowRow = async (workflowId: string): Promise<WorkflowRow | undefined> =>
  (
    await db.select().from(movementWorkflows).where(eq(movementWorkflows.id, workflowId)).limit(1)
  )[0];

const waitForWorkflowStatus = async (
  workflowId: string,
  statuses: string[],
  timeoutMs = 8000,
): Promise<WorkflowRow> => {
  const start = Date.now();
  for (;;) {
    const row = await getWorkflowRow(workflowId);
    if (row && statuses.includes(row.status)) {
      return row;
    }
    if (Date.now() - start > timeoutMs) {
      throw new Error(
        `Workflow ${workflowId} did not reach [${statuses.join(", ")}] within ${timeoutMs}ms (last: ${row?.status ?? "missing"})`,
      );
    }
    await sleep(25);
  }
};

/** Waits until the workflow's transcript ends with the given assistant reply. */
const waitForReply = async (
  workflowId: string,
  reply: string,
  timeoutMs = 8000,
): Promise<WorkflowRow> => {
  const start = Date.now();
  for (;;) {
    const row = await getWorkflowRow(workflowId);
    if (row?.messages.at(-1)?.role === "assistant" && row.messages.at(-1)?.content === reply) {
      return row;
    }
    if (Date.now() - start > timeoutMs) {
      throw new Error(
        `Workflow ${workflowId} did not reply '${reply}' within ${timeoutMs}ms (last: ${row?.messages.at(-1)?.content ?? "none"})`,
      );
    }
    await sleep(25);
  }
};

//
// Scenarios
//

describe("AI workflows", () => {
  it("creates an activity when the workflow is manually triggered", async () => {
    const user = await createUser();
    mockMistral.enqueue(
      toolCallResponse("createActivity", {
        name: "Spotify",
        type: "expense",
        amount: -12.99,
      }),
    );

    const movementId = await createMovement(user, "Spotify", -12.99);

    // Movement creation never auto-starts a workflow: the workflow is
    // created (and run) only by the explicit manual trigger.
    const beforeTrigger = await queryMovements(user);
    expect(beforeTrigger.movements.find((m) => m.id === movementId)?.workflow).toBeNull();

    const workflowId = await triggerWorkflowOnMovement(user, movementId);
    const row = await waitForWorkflowStatus(workflowId, ["succeeded"]);

    // The workflow reports what it did.
    expect(row.status).toBe("succeeded");
    expect(row.trigger).toBe("manual");
    expect(row.result?.createdActivities).toHaveLength(1);
    expect(row.result?.linkedActivities).toEqual([]);
    expect(row.error).toBeNull();

    // The activity exists and the movement is fully allocated.
    const activities = await queryActivities(user);
    const created = activities.activities.filter((activity) => activity.name === "Spotify");
    expect(created).toHaveLength(1);
    expect(created[0]!.type).toBe("expense");
    expect(created[0]!.movements).toHaveLength(1);
    expect(created[0]!.movements[0]!.movement).toBe(movementId);

    const movementsData = await queryMovements(user);
    const movement = movementsData.movements.find((m) => m.id === movementId);
    expect(movement?.status).toBe("completed");

    // The transcript carries the summary message.
    const workflow = movement?.workflow;
    expect(workflow?.messages.at(-1)?.role).toBe("assistant");
    expect(workflow?.messages.at(-1)?.content).toContain("Spotify");

    // The Mistral API was called with the configured model and key, the
    // system prompt, and the tool list.
    expect(mockMistral.requests).toHaveLength(1);
    expect(mockMistral.requests[0]!.model).toBe("glm-5-2");
    expect(mockMistral.authorizations[0]).toBe("Bearer test-key");
    const firstMessage = mockMistral.requests[0]!.messages[0]!;
    expect(firstMessage.role).toBe("system");
    expect(firstMessage.content).toContain("double-entry ledger");
    expect(mockMistral.requests[0]!.tools.map((tool) => tool.function.name)).toContain(
      "createActivity",
    );
    const taskMessage = JSON.parse(mockMistral.requests[0]!.messages[1]!.content ?? "{}");
    expect(taskMessage.movement.name).toBe("Spotify");
    expect(taskMessage.movement.amount).toBe(-12.99);

    // The workflow lifecycle was published through the sync event stream. The
    // createWorkflow event is emitted on the user's own session (like every
    // create event it is not echoed back to that session), so only the
    // workflow-driven updates are visible here.
    const events = await queryEvents(user);
    const workflowEvents = events.events
      .map((event) => ({ ...event, payload: JSON.parse(event.payload) }))
      .filter((event) => ["createWorkflow", "updateWorkflow"].includes(event.type));
    const statuses = workflowEvents
      .filter((event) => event.type === "updateWorkflow")
      .map((event) => event.payload.status);
    expect(statuses).toContain("running");
    expect(
      workflowEvents.filter(
        (event) => event.type === "updateWorkflow" && event.payload.status === "succeeded",
      ),
    ).toHaveLength(1);
  });

  it("links the movement to an existing activity instead of creating a duplicate", async () => {
    const user = await createUser();
    const activityId = await createActivityManually(user, "Spotify", -12.99);
    mockMistral.enqueue(toolCallResponse("linkMovement", { activityId, amount: -12.99 }));

    const movementId = await createMovement(user, "Spotify", -12.99);
    const workflowId = await triggerWorkflowOnMovement(user, movementId);
    const row = await waitForWorkflowStatus(workflowId, ["succeeded"]);

    expect(row.result).toEqual({
      createdActivities: [],
      linkedActivities: [activityId],
    });

    const activities = await queryActivities(user);
    expect(activities.activities.filter((activity) => activity.name === "Spotify")).toHaveLength(1);
    const movementsData = await queryMovements(user);
    expect(movementsData.movements.find((m) => m.id === movementId)?.status).toBe("completed");
  });

  it("splits a movement across several activities", async () => {
    const user = await createUser();
    mockMistral.enqueue(
      toolCallResponse("createActivity", { name: "Groceries", type: "expense", amount: -15 }),
    );
    mockMistral.enqueue(
      toolCallResponse("createActivity", { name: "Pharmacy", type: "expense", amount: -5 }),
    );

    const movementId = await createMovement(user, "Supermarket", -20);
    const workflowId = await triggerWorkflowOnMovement(user, movementId);
    const row = await waitForWorkflowStatus(workflowId, ["succeeded"]);

    expect(row.result?.createdActivities).toHaveLength(2);
    expect(row.result?.linkedActivities).toEqual([]);

    const movementsData = await queryMovements(user);
    const movement = movementsData.movements.find((m) => m.id === movementId);
    expect(movement?.status).toBe("completed");
    expect(movement?.activities).toHaveLength(2);
  });

  it("refuses over-allocation and lets the model correct itself", async () => {
    const user = await createUser();
    const activityId = await createActivityManually(user, "Savings", -100);
    // First attempt exceeds the remaining allocation.
    mockMistral.enqueue(toolCallResponse("linkMovement", { activityId, amount: -30 }));
    // Corrected attempt.
    mockMistral.enqueue(toolCallResponse("linkMovement", { activityId, amount: -20 }));

    const movementId = await createMovement(user, "Transfer", -20);
    const workflowId = await triggerWorkflowOnMovement(user, movementId);
    await waitForWorkflowStatus(workflowId, ["succeeded"]);

    // Only the corrected link exists.
    const links = await db
      .select()
      .from(movementsActivities)
      .where(eq(movementsActivities.movement, movementId));
    expect(links).toHaveLength(1);
    expect(links[0]!.amount).toBe(-20);

    // The model saw the refusal and corrected.
    expect(mockMistral.requests).toHaveLength(2);
    const secondRequest = mockMistral.requests[1]!;
    const toolResult = secondRequest.messages.find(
      (message) => message.role === "tool" && message.content?.includes("exceeds"),
    );
    expect(toolResult).toBeTruthy();
  });

  it("pauses on askUser and resumes with the answer", async () => {
    const user = await createUser();
    mockMistral.enqueue(
      toolCallResponse("askUser", {
        question: "Which subscription is this?",
        options: [{ label: "Spotify" }, { label: "Netflix" }],
      }),
    );

    const movementId = await createMovement(user, "SUBSCRIPTION", -12.99);
    const workflowId = await triggerWorkflowOnMovement(user, movementId);
    await waitForWorkflowStatus(workflowId, ["pending"]);

    let row = await getWorkflowRow(workflowId);
    expect(row?.messages).toHaveLength(1);
    expect(row?.messages[0]?.role).toBe("assistant");
    expect(row?.messages[0]?.content).toBe("Which subscription is this?");
    expect(row?.messages[0]?.options).toEqual([
      { id: "option-0", label: "Spotify" },
      { id: "option-1", label: "Netflix" },
    ]);

    mockMistral.enqueue(
      toolCallResponse("createActivity", { name: "Spotify", type: "expense", amount: -12.99 }),
    );
    await gql(user.token, ANSWER_WORKFLOW, {
      id: workflowId,
      content: "It's Spotify",
      optionId: "option-0",
    });
    await waitForWorkflowStatus(workflowId, ["succeeded"]);

    row = await getWorkflowRow(workflowId);
    // question, answer, progress narration, summary.
    expect(row?.messages).toHaveLength(4);
    expect(row?.messages[1]?.role).toBe("user");
    expect(row?.messages[1]?.content).toBe("It's Spotify");
    expect(row?.messages[1]?.optionId).toBe("option-0");

    // The resumed conversation includes the question and the answer.
    const resumed = mockMistral.requests[1]!;
    const contents = resumed.messages.map((message) => message.content ?? "");
    expect(contents.some((content) => content.includes("Which subscription is this?"))).toBe(true);
    expect(contents.some((content) => content.includes("It's Spotify"))).toBe(true);

    const movementsData = await queryMovements(user);
    expect(movementsData.movements.find((m) => m.id === movementId)?.status).toBe("completed");
  });

  it("fails on giveUp, then a manual retry succeeds", async () => {
    const user = await createUser();
    mockMistral.enqueue(toolCallResponse("giveUp", { reason: "Unknown merchant" }));

    const movementId = await createMovement(user, "MYSTERY PAYMENT", -99);
    const workflowId = await triggerWorkflowOnMovement(user, movementId);
    const row = await waitForWorkflowStatus(workflowId, ["failed"]);

    expect(row.result?.error?.kind).toBe("model_give_up");
    expect(row.result?.error?.message).toBe("Unknown merchant");
    expect(row.error).toBe("Unknown merchant");
    expect(row.messages.at(-1)?.content).toContain("Unknown merchant");

    // The movement stays incomplete and untouched.
    let movementsData = await queryMovements(user);
    expect(movementsData.movements.find((m) => m.id === movementId)?.status).toBe("incomplete");

    // Manual trigger retries with a fresh run and succeeds.
    mockMistral.enqueue(
      toolCallResponse("createActivity", { name: "Mystery", type: "expense", amount: -99 }),
    );
    await gql(user.token, TRIGGER_WORKFLOW, { movementId });
    await waitForWorkflowStatus(workflowId, ["succeeded"]);

    const retriedRow = await getWorkflowRow(workflowId);
    expect(retriedRow?.attempts).toBeGreaterThanOrEqual(2);
    movementsData = await queryMovements(user);
    expect(movementsData.movements.find((m) => m.id === movementId)?.status).toBe("completed");
  });

  it("processes two similar movements serially without creating a duplicate activity", async () => {
    const user = await createUser();
    // Workflow A: creates the activity.
    mockMistral.enqueue(
      toolCallResponse("createActivity", { name: "Spotify", type: "expense", amount: -12.99 }),
    );
    // Workflow B: runs after A (runs are serialized per user), so its
    // evidence pack carries A's Spotify activity — the model reads it and
    // links to it instead of creating a duplicate.
    mockMistral.enqueue((request) => {
      const taskMessage = request.messages.find(
        (message) => message.role === "user" && message.content?.includes('"movement"'),
      );
      const evidence = JSON.parse(taskMessage?.content ?? "{}") as {
        history: { activitiesByDateWindow: { id: string; name: string }[] };
      };
      const spotify = evidence.history.activitiesByDateWindow.find(
        (activity) => activity.name === "Spotify",
      );
      if (!spotify) {
        throw new Error("A's Spotify activity not found in B's evidence");
      }
      return toolCallResponse("linkMovement", { activityId: spotify.id, amount: -12.99 });
    });

    const movementA = await createMovement(user, "Spotify", -12.99);
    const workflowA = await triggerWorkflowOnMovement(user, movementA);
    const movementB = await createMovement(user, "Spotify", -12.99);
    const workflowB = await triggerWorkflowOnMovement(user, movementB);

    const rowA = await waitForWorkflowStatus(workflowA, ["succeeded"]);
    const rowB = await waitForWorkflowStatus(workflowB, ["succeeded"]);

    // Exactly one activity named Spotify exists, and both movements link to it.
    const activities = await queryActivities(user);
    const spotify = activities.activities.filter((activity) => activity.name === "Spotify");
    expect(spotify).toHaveLength(1);

    const activityId = spotify[0]!.id;
    expect(rowA.result?.createdActivities).toEqual([activityId]);
    expect(rowB.result?.linkedActivities).toEqual([activityId]);

    const links = await db.select().from(movementsActivities);
    expect(links.filter((link) => link.activity === activityId)).toHaveLength(2);
  });

  it("cancels the workflow when the user reconciles the movement by hand", async () => {
    const user = await createUser();
    const activityId = await createActivityManually(user, "Spotify", -12.99);
    mockMistral.enqueue(
      toolCallResponse("askUser", { question: "Is this the usual subscription?" }),
    );

    const movementId = await createMovement(user, "Spotify", -12.99);
    const workflowId = await triggerWorkflowOnMovement(user, movementId);
    await waitForWorkflowStatus(workflowId, ["pending"]);

    // The user links the movement manually while the workflow waits.
    await linkMovementManually(user, movementId, activityId, -12.99);
    const row = await waitForWorkflowStatus(workflowId, ["cancelled"]);
    expect(row.status).toBe("cancelled");

    const movementsData = await queryMovements(user);
    expect(movementsData.movements.find((m) => m.id === movementId)?.status).toBe("completed");
  });

  it("answers follow-up questions after the movement is reconciled", async () => {
    const user = await createUser();
    mockMistral.enqueue(
      toolCallResponse("createActivity", { name: "Rent", type: "expense", amount: -800 }),
    );

    const movementId = await createMovement(user, "STANDING ORDER", -800);
    const workflowId = await triggerWorkflowOnMovement(user, movementId);
    const succeeded = await waitForWorkflowStatus(workflowId, ["succeeded"]);
    expect(succeeded.result?.createdActivities).toHaveLength(1);

    // The movement is reconciled: the user asks a follow-up question and the
    // assistant answers in a follow-up turn of the full conversation loop.
    mockMistral.enqueue(textResponse("I created the 'Rent' activity for the full -800."));
    await gql(user.token, ANSWER_WORKFLOW, {
      id: workflowId,
      content: "Why did you categorize it as rent?",
    });
    const row = await waitForReply(workflowId, "I created the 'Rent' activity for the full -800.");

    // The reply is appended to the transcript and the workflow settles back
    // to succeeded, keeping its original result and error.
    expect(row.status).toBe("succeeded");
    expect(row.result?.createdActivities).toHaveLength(1);
    expect(row.error).toBeNull();
    const messages = row.messages.filter((m) => m.role !== "separator");
    expect(messages.at(-2)?.role).toBe("user");
    expect(messages.at(-2)?.content).toBe("Why did you categorize it as rent?");
    expect(messages.at(-1)?.role).toBe("assistant");
    expect(messages.at(-1)?.content).toBe("I created the 'Rent' activity for the full -800.");

    // The follow-up turn runs the full loop: the tools are offered (so the
    // assistant can act when asked), the follow-up system prompt is used, the
    // evidence is replayed with zero remaining, and the transcript carries
    // the question and the summary.
    const followUp = mockMistral.requests[1]!;
    expect(followUp.tools?.map((tool) => tool.function.name)).toContain("editActivity");
    expect(followUp.messages[0]?.role).toBe("system");
    expect(followUp.messages[0]?.content).toContain("already fully reconciled");
    const task = JSON.parse(followUp.messages[1]?.content ?? "{}");
    expect(task.movement.name).toBe("STANDING ORDER");
    expect(task.remainingToAllocate).toBe(0);
    const contents = followUp.messages.map((message) => message.content ?? "");
    expect(contents.some((content) => content.includes("Why did you categorize it as rent?"))).toBe(
      true,
    );
    expect(contents.some((content) => content.includes("Movement fully allocated"))).toBe(true);

    // The ledger was not touched: still one link, one activity.
    const links = await db
      .select()
      .from(movementsActivities)
      .where(eq(movementsActivities.movement, movementId));
    expect(links).toHaveLength(1);
    const activities = await queryActivities(user);
    expect(activities.activities.filter((activity) => activity.name === "Rent")).toHaveLength(1);
  });

  it("edits the created activity when the user asks for a change on a follow-up", async () => {
    const user = await createUser();
    mockMistral.enqueue(
      toolCallResponse("createActivity", { name: "Rent", type: "expense", amount: -800 }),
    );

    const movementId = await createMovement(user, "STANDING ORDER", -800);
    const workflowId = await triggerWorkflowOnMovement(user, movementId);
    const succeeded = await waitForWorkflowStatus(workflowId, ["succeeded"]);
    const createdActivityId = succeeded.result?.createdActivities[0];

    // The user asks for a change: the follow-up turn offers the tools and
    // the assistant renames the activity it created, then answers.
    mockMistral.enqueue(
      toolCallResponse("editActivity", { activityId: createdActivityId, name: "Housing" }),
    );
    mockMistral.enqueue(textResponse("I renamed 'Rent' to 'Housing'."));
    await gql(user.token, ANSWER_WORKFLOW, {
      id: workflowId,
      content: "Rename the activity to Housing.",
    });
    const row = await waitForReply(workflowId, "I renamed 'Rent' to 'Housing'.");

    // The activity was renamed and the workflow settles back to succeeded,
    // keeping its original result.
    expect(row.status).toBe("succeeded");
    expect(row.result?.createdActivities).toHaveLength(1);
    const activities = await queryActivities(user);
    expect(activities.activities.filter((activity) => activity.name === "Housing")).toHaveLength(1);
    expect(activities.activities.filter((activity) => activity.name === "Rent")).toHaveLength(0);
  });

  it("answers follow-ups on a workflow the user reconciled by hand, staying cancelled", async () => {
    const user = await createUser();
    const activityId = await createActivityManually(user, "Spotify", -12.99);
    mockMistral.enqueue(
      toolCallResponse("askUser", { question: "Is this the usual subscription?" }),
    );

    const movementId = await createMovement(user, "Spotify", -12.99);
    const workflowId = await triggerWorkflowOnMovement(user, movementId);
    await waitForWorkflowStatus(workflowId, ["pending"]);
    await linkMovementManually(user, movementId, activityId, -12.99);
    await waitForWorkflowStatus(workflowId, ["cancelled"]);

    // The movement is reconciled by hand: the conversation can still continue.
    mockMistral.enqueue(textResponse("You linked it to the existing 'Spotify' activity."));
    await gql(user.token, ANSWER_WORKFLOW, {
      id: workflowId,
      content: "How should I have categorized it?",
    });
    const row = await waitForReply(workflowId, "You linked it to the existing 'Spotify' activity.");

    expect(row.status).toBe("cancelled");
    expect(row.result).toBeNull();
    expect(row.error).toBeNull();
    expect(row.messages.at(-1)?.role).toBe("assistant");
    expect(row.messages.at(-2)?.role).toBe("user");
  });

  it("rejects answers on workflows whose movement is not reconciled", async () => {
    const user = await createUser();
    mockMistral.enqueue(toolCallResponse("giveUp", { reason: "No clue" }));

    const movementId = await createMovement(user, "MYSTERY PAYMENT", -42);
    const workflowId = await triggerWorkflowOnMovement(user, movementId);
    await waitForWorkflowStatus(workflowId, ["failed"]);

    const response = await fetch(`${baseUrl}/graphql`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${user.token}` },
      body: JSON.stringify({
        query: ANSWER_WORKFLOW,
        variables: { id: workflowId, content: "What about rent?" },
      }),
    });
    const body = (await response.json()) as { errors?: { message: string }[] };
    expect(body.errors?.[0]?.message).toContain("not reconciled");

    // The workflow and its transcript are untouched.
    const row = await getWorkflowRow(workflowId);
    expect(row?.status).toBe("failed");
    expect(row?.messages.filter((m) => m.role === "user")).toHaveLength(0);
  });

  it("retries provider errors, then fails with the provider error kind", async () => {
    const user = await createUser();
    // No scripted responses: MockMistral answers 500 on every call.

    const movementId = await createMovement(user, "Netflix", -15);
    const workflowId = await triggerWorkflowOnMovement(user, movementId);
    const row = await waitForWorkflowStatus(workflowId, ["failed"], 15000);

    expect(row.result?.error?.kind).toBe("provider_error");
    expect(row.attempts).toBe(2);
    expect(mockMistral.requests).toHaveLength(2);
  });

  it("does not create workflows when the workflow is not configured", async () => {
    delete process.env.MISTRAL_API_KEY;
    try {
      const user = await createUser();
      const data = await gql<{
        createMovement: { id: string; workflow: { id: string } | null };
      }>(user.token, CREATE_MOVEMENT, {
        id: crypto.randomUUID(),
        name: "No workflow here",
        date: "2026-09-01",
        amount: -10,
        account: user.bankAccountId,
      });
      expect(data.createMovement.workflow).toBeNull();

      // Manual trigger surfaces a clear configuration error.
      const response = await fetch(`${baseUrl}/graphql`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${user.token}` },
        body: JSON.stringify({
          query: TRIGGER_WORKFLOW,
          variables: { movementId: data.createMovement.id },
        }),
      });
      const body = (await response.json()) as { errors?: { message: string }[] };
      expect(body.errors?.[0]?.message).toContain("not configured");
    } finally {
      process.env.MISTRAL_API_KEY = "test-key";
    }
  });

  it("picks up queued workflows on boot", async () => {
    const user = await createUser();

    // Simulate a movement + workflow left queued by a previous shutdown.
    const movementId = crypto.randomUUID();
    await db.insert(movements).values({
      id: movementId,
      user: user.userId,
      name: "Leftover",
      date: new Date("2026-09-01"),
      amount: -42,
      account: user.bankAccountId,
      history: [],
    });
    await db.insert(movementWorkflows).values({
      id: crypto.randomUUID(),
      user: user.userId,
      movement: movementId,
      status: "queued",
      trigger: "auto",
      messages: [],
    });

    mockMistral.enqueue(
      toolCallResponse("createActivity", { name: "Leftover", type: "expense", amount: -42 }),
    );

    const { startWorkflows } = await import("@/workflows/queue");
    await startWorkflows();

    const queued = await db
      .select()
      .from(movementWorkflows)
      .where(eq(movementWorkflows.movement, movementId));
    const workflowId = queued[0]!.id;
    await waitForWorkflowStatus(workflowId, ["succeeded"]);

    const links = await db
      .select()
      .from(movementsActivities)
      .where(eq(movementsActivities.movement, movementId));
    expect(links).toHaveLength(1);
  });

  it("records the initial hint message and replays it to the model", async () => {
    const user = await createUser();
    mockMistral.enqueue(
      toolCallResponse("createActivity", { name: "Rent", type: "expense", amount: -800 }),
    );

    const movementId = await createMovement(user, "STANDING ORDER", -800);
    const workflowId = await triggerWorkflowOnMovement(
      user,
      movementId,
      "  This is the monthly rent  ",
    );
    await waitForWorkflowStatus(workflowId, ["succeeded"]);

    // The hint is the first transcript message, trimmed.
    const row = await getWorkflowRow(workflowId);
    expect(row?.messages[0]?.role).toBe("user");
    expect(row?.messages[0]?.content).toBe("This is the monthly rent");

    // The run replayed the hint to the model, right after the task message.
    const request = mockMistral.requests[0]!;
    expect(request.messages[1]?.role).toBe("user");
    expect(request.messages[2]?.role).toBe("user");
    expect(request.messages[2]?.content).toBe("This is the monthly rent");
  });

  it("appends the hint to the transcript on a manual retry", async () => {
    const user = await createUser();
    mockMistral.enqueue(toolCallResponse("giveUp", { reason: "Unknown merchant" }));

    const movementId = await createMovement(user, "MYSTERY PAYMENT", -42);
    const workflowId = await triggerWorkflowOnMovement(user, movementId);
    await waitForWorkflowStatus(workflowId, ["failed"]);

    // Retry with a hint: the transcript gains a separator and the hint.
    mockMistral.enqueue(
      toolCallResponse("createActivity", { name: "Rent", type: "expense", amount: -42 }),
    );
    await triggerWorkflowOnMovement(user, movementId, "It is the rent");
    await waitForWorkflowStatus(workflowId, ["succeeded"]);

    const row = await getWorkflowRow(workflowId);
    const messages = row?.messages ?? [];
    const separatorIndex = messages.findIndex((m) => m.role === "separator");
    const hintIndex = messages.findIndex((m) => m.role === "user");
    // give-up message, session separator, hint, success summary.
    expect(separatorIndex).toBe(1);
    expect(hintIndex).toBe(2);
    expect(messages[hintIndex]?.content).toBe("It is the rent");

    // The retried run saw the previous give-up and the hint.
    const retriedRequest = mockMistral.requests[1]!;
    const contents = retriedRequest.messages.map((message) => message.content ?? "");
    expect(contents.some((content) => content.includes("Unknown merchant"))).toBe(true);
    expect(contents.some((content) => content.includes("It is the rent"))).toBe(true);
  });

  it("exposes workflows through the workflows query with status filtering", async () => {
    const user = await createUser();
    mockMistral.enqueue(toolCallResponse("giveUp", { reason: "No clue" }));
    const movementId = await createMovement(user, "Unknown", -1);
    const workflowId = await triggerWorkflowOnMovement(user, movementId);
    await waitForWorkflowStatus(workflowId, ["failed"]);

    const query = /* GraphQL */ `
      query Workflows($statuses: [String!]) {
        workflows(statuses: $statuses) {
          id
          status
          trigger
          attempts
        }
      }
    `;
    const failed = await gql<{
      workflows: { id: string; status: string; trigger: string; attempts: number }[];
    }>(user.token, query, { statuses: ["failed"] });
    expect(failed.workflows).toHaveLength(1);
    expect(failed.workflows[0]!.id).toBe(workflowId);

    const pending = await gql<{ workflows: unknown[] }>(user.token, query, {
      statuses: ["pending"],
    });
    expect(pending.workflows).toHaveLength(0);
  });
});
