import { yoga } from "@/api";
import { ensureHarnessSession } from "./session";

/**
 * In-process GraphQL client for the harness. Requests go through the exact
 * same yoga instance and mutation resolvers as user clients, authenticated
 * with the harness machine session's bearer token.
 */

const HARNESS_API_URL = "http://harness.internal/graphql";

const tokenCache = new Map<string, string>();

const getHarnessToken = async (userId: string): Promise<string> => {
  const cached = tokenCache.get(userId);
  if (cached) {
    return cached;
  }
  const token = await ensureHarnessSession(userId);
  tokenCache.set(userId, token);
  return token;
};

export async function harnessGraphQL<T = unknown>(
  userId: string,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const token = await getHarnessToken(userId);

  const response = await yoga.fetch(
    new Request(HARNESS_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query, variables }),
    }),
  );

  const body = (await response.json()) as {
    data?: T;
    errors?: { message: string }[];
  };

  if (body.errors?.length) {
    throw new Error(`Harness GraphQL call failed: ${body.errors[0]?.message}`);
  }

  return body.data as T;
}

export async function invalidateHarnessToken(userId: string): Promise<void> {
  tokenCache.delete(userId);
}
