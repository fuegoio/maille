import type {
  CreateViewEvent,
  DeleteViewEvent,
  UpdateViewEvent,
} from "@maille/core/sync";

import { graphql } from "@/gql";

import type { MutationType } from "./type";

export const createViewMutation = graphql(/* GraphQL */ `
  mutation CreateView(
    $id: String!
    $name: String!
    $scope: String!
    $resource: String!
    $config: String!
  ) {
    createView(
      id: $id
      name: $name
      scope: $scope
      resource: $resource
      config: $config
    ) {
      id
    }
  }
`);

export const updateViewMutation = graphql(/* GraphQL */ `
  mutation UpdateView($id: String!, $name: String, $config: String) {
    updateView(id: $id, name: $name, config: $config) {
      id
    }
  }
`);

export const deleteViewMutation = graphql(/* GraphQL */ `
  mutation DeleteView($id: String!) {
    deleteView(id: $id)
  }
`);

export type CreateViewMutation = MutationType<
  "createView",
  typeof createViewMutation,
  undefined,
  [CreateViewEvent]
>;

export type UpdateViewMutation = MutationType<
  "updateView",
  typeof updateViewMutation,
  { name?: string; config?: string },
  [UpdateViewEvent]
>;

export type DeleteViewMutation = MutationType<
  "deleteView",
  typeof deleteViewMutation,
  import("@maille/core/views").View,
  [DeleteViewEvent]
>;

export type ViewMutation =
  | CreateViewMutation
  | UpdateViewMutation
  | DeleteViewMutation;
