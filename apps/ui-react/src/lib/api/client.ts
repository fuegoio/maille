import { GraphQLClient } from "graphql-request";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/graphql";

// Create GraphQL client
export const graphqlClient = new GraphQLClient(API_URL, {
  credentials: "include",
  mode: "cors",
});

// Helper function to add authentication token
export const createAuthenticatedClient = (token: string) => {
  return new GraphQLClient(API_URL, {
    credentials: "include",
    mode: "cors",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// Error handling wrapper
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  errorMessage: string = "An error occurred",
): Promise<{ data?: T; error?: Error }> {
  try {
    const data = await fn();
    return { data };
  } catch (error) {
    console.error(errorMessage, error);
    return { error: error instanceof Error ? error : new Error(errorMessage) };
  }
}

// Basic query function
export async function query<T>(
  query: string,
  variables?: Record<string, any>,
): Promise<T> {
  const response = await graphqlClient.request<T>(query, variables);
  return response;
}

// Basic mutation function
export async function mutate<T>(
  mutation: string,
  variables?: Record<string, any>,
): Promise<T> {
  const response = await graphqlClient.request<T>(mutation, variables);
  return response;
}

