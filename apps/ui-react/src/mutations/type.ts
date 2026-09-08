import type { VariablesOf, ResultOf } from "@graphql-typed-document-node/core";
import type { SyncEvent } from "@maille/core/sync";

/**
 * Omit that distributes over unions, so event types stay discriminated
 * (a plain Omit merges union members into one object).
 */
type DistributiveOmit<T, K extends keyof never> = T extends unknown
  ? Omit<T, K>
  : never;

export type MutationType<
  Name extends string,
  Mutation,
  RollbackData,
  Events extends Array<SyncEvent>,
> = {
  /**
   * The name of the mutation.
   */
  name: Name;

  /**
   * The GraphQL mutation.
   */
  mutation: Mutation;
  /**
   * The variables for the mutation.
   */
  variables: VariablesOf<Mutation>;
  /**
   * The result of the mutation.
   */
  result?: ResultOf<Mutation>;
  /**
   * The data to rollback the mutation.
   */
  rollbackData: RollbackData;

  /**
   * The expected events from the mutation.
   * This is used to optimistically update the UI before the mutation is actually executed.
   */
  events: Array<
    DistributiveOmit<Events[number], "clientId" | "createdAt" | "user">
  >;
};
