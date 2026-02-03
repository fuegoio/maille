/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query WorkspaceData($workspace: UUID!) {\n    workspace(id: $workspace) {\n      id\n      name\n      startingDate\n      currency\n      createdAt\n      users {\n        id\n        name\n        email\n        image\n      }\n    }\n\n    activities(workspaceId: $workspace) {\n      id\n      user\n      number\n      name\n      description\n      date\n      type\n      category\n      subcategory\n      project\n      transactions {\n        id\n        amount\n        fromAccount\n        toAccount\n      }\n      movements {\n        id\n        movement\n        amount\n      }\n      amount\n      status\n    }\n\n    activityCategories(workspaceId: $workspace) {\n      id\n      name\n      type\n    }\n\n    activitySubcategories(workspaceId: $workspace) {\n      id\n      name\n      category\n    }\n\n    accounts(workspaceId: $workspace) {\n      id\n      name\n      type\n      default\n      startingBalance\n      startingCashBalance\n      movements\n    }\n\n    movements(workspaceId: $workspace) {\n      id\n      date\n      amount\n      account\n      name\n      activities {\n        id\n        activity\n        amount\n      }\n      status\n    }\n\n    projects(workspaceId: $workspace) {\n      id\n      name\n      emoji\n      startDate\n      endDate\n    }\n  }\n": typeof types.WorkspaceDataDocument,
    "\n  mutation CreateWorkspace(\n    $name: String!\n    $currency: String!\n    $startingDate: Date!\n  ) {\n    createWorkspace(\n      name: $name\n      currency: $currency\n      startingDate: $startingDate\n    ) {\n      id\n      name\n      currency\n      startingDate\n      createdAt\n      users {\n        id\n        email\n        name\n        image\n      }\n    }\n  }\n": typeof types.CreateWorkspaceDocument,
    "\n  query Workspaces {\n    workspaces {\n      id\n      name\n    }\n  }\n": typeof types.WorkspacesDocument,
};
const documents: Documents = {
    "\n  query WorkspaceData($workspace: UUID!) {\n    workspace(id: $workspace) {\n      id\n      name\n      startingDate\n      currency\n      createdAt\n      users {\n        id\n        name\n        email\n        image\n      }\n    }\n\n    activities(workspaceId: $workspace) {\n      id\n      user\n      number\n      name\n      description\n      date\n      type\n      category\n      subcategory\n      project\n      transactions {\n        id\n        amount\n        fromAccount\n        toAccount\n      }\n      movements {\n        id\n        movement\n        amount\n      }\n      amount\n      status\n    }\n\n    activityCategories(workspaceId: $workspace) {\n      id\n      name\n      type\n    }\n\n    activitySubcategories(workspaceId: $workspace) {\n      id\n      name\n      category\n    }\n\n    accounts(workspaceId: $workspace) {\n      id\n      name\n      type\n      default\n      startingBalance\n      startingCashBalance\n      movements\n    }\n\n    movements(workspaceId: $workspace) {\n      id\n      date\n      amount\n      account\n      name\n      activities {\n        id\n        activity\n        amount\n      }\n      status\n    }\n\n    projects(workspaceId: $workspace) {\n      id\n      name\n      emoji\n      startDate\n      endDate\n    }\n  }\n": types.WorkspaceDataDocument,
    "\n  mutation CreateWorkspace(\n    $name: String!\n    $currency: String!\n    $startingDate: Date!\n  ) {\n    createWorkspace(\n      name: $name\n      currency: $currency\n      startingDate: $startingDate\n    ) {\n      id\n      name\n      currency\n      startingDate\n      createdAt\n      users {\n        id\n        email\n        name\n        image\n      }\n    }\n  }\n": types.CreateWorkspaceDocument,
    "\n  query Workspaces {\n    workspaces {\n      id\n      name\n    }\n  }\n": types.WorkspacesDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query WorkspaceData($workspace: UUID!) {\n    workspace(id: $workspace) {\n      id\n      name\n      startingDate\n      currency\n      createdAt\n      users {\n        id\n        name\n        email\n        image\n      }\n    }\n\n    activities(workspaceId: $workspace) {\n      id\n      user\n      number\n      name\n      description\n      date\n      type\n      category\n      subcategory\n      project\n      transactions {\n        id\n        amount\n        fromAccount\n        toAccount\n      }\n      movements {\n        id\n        movement\n        amount\n      }\n      amount\n      status\n    }\n\n    activityCategories(workspaceId: $workspace) {\n      id\n      name\n      type\n    }\n\n    activitySubcategories(workspaceId: $workspace) {\n      id\n      name\n      category\n    }\n\n    accounts(workspaceId: $workspace) {\n      id\n      name\n      type\n      default\n      startingBalance\n      startingCashBalance\n      movements\n    }\n\n    movements(workspaceId: $workspace) {\n      id\n      date\n      amount\n      account\n      name\n      activities {\n        id\n        activity\n        amount\n      }\n      status\n    }\n\n    projects(workspaceId: $workspace) {\n      id\n      name\n      emoji\n      startDate\n      endDate\n    }\n  }\n"): (typeof documents)["\n  query WorkspaceData($workspace: UUID!) {\n    workspace(id: $workspace) {\n      id\n      name\n      startingDate\n      currency\n      createdAt\n      users {\n        id\n        name\n        email\n        image\n      }\n    }\n\n    activities(workspaceId: $workspace) {\n      id\n      user\n      number\n      name\n      description\n      date\n      type\n      category\n      subcategory\n      project\n      transactions {\n        id\n        amount\n        fromAccount\n        toAccount\n      }\n      movements {\n        id\n        movement\n        amount\n      }\n      amount\n      status\n    }\n\n    activityCategories(workspaceId: $workspace) {\n      id\n      name\n      type\n    }\n\n    activitySubcategories(workspaceId: $workspace) {\n      id\n      name\n      category\n    }\n\n    accounts(workspaceId: $workspace) {\n      id\n      name\n      type\n      default\n      startingBalance\n      startingCashBalance\n      movements\n    }\n\n    movements(workspaceId: $workspace) {\n      id\n      date\n      amount\n      account\n      name\n      activities {\n        id\n        activity\n        amount\n      }\n      status\n    }\n\n    projects(workspaceId: $workspace) {\n      id\n      name\n      emoji\n      startDate\n      endDate\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateWorkspace(\n    $name: String!\n    $currency: String!\n    $startingDate: Date!\n  ) {\n    createWorkspace(\n      name: $name\n      currency: $currency\n      startingDate: $startingDate\n    ) {\n      id\n      name\n      currency\n      startingDate\n      createdAt\n      users {\n        id\n        email\n        name\n        image\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateWorkspace(\n    $name: String!\n    $currency: String!\n    $startingDate: Date!\n  ) {\n    createWorkspace(\n      name: $name\n      currency: $currency\n      startingDate: $startingDate\n    ) {\n      id\n      name\n      currency\n      startingDate\n      createdAt\n      users {\n        id\n        email\n        name\n        image\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Workspaces {\n    workspaces {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  query Workspaces {\n    workspaces {\n      id\n      name\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;