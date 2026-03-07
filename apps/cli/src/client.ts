import { requireAuth } from "./config.js";

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; locations?: unknown; path?: unknown }>;
}

export async function gql<T>(
  query: string,
  variables?: Record<string, unknown>,
  auth?: { token: string; apiUrl: string }
): Promise<T> {
  const { token, apiUrl } = auth ?? requireAuth();

  const response = await fetch(`${apiUrl}/api/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      console.error("Session expired. Run: maille login");
      process.exit(1);
    }
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const json = (await response.json()) as GraphQLResponse<T>;

  if (json.errors?.length) {
    const messages = json.errors.map((e) => e.message).join("\n");
    throw new Error(messages);
  }

  if (!json.data) {
    throw new Error("No data returned from API");
  }

  return json.data;
}
