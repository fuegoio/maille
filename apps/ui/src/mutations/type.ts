import type { VariablesOf, ResultOf } from "@graphql-typed-document-node/core";

export type MutationType<Name extends string, Mutation, RollbackData> = {
  name: Name;
  mutation: Mutation;
  variables: VariablesOf<Mutation>;
  result?: ResultOf<Mutation>;
  rollbackData: RollbackData;
};
