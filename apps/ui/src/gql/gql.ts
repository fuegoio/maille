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
 */
const documents = {
    "\n  mutation CreateActivity(\n    $category: UUID\n    $date: Date!\n    $description: String\n    $id: UUID!\n    $movement: ActivityMovementInput\n    $name: String!\n    $project: UUID\n    $subcategory: UUID\n    $transactions: [TransactionInput!]\n    $type: String!\n  ) {\n    createActivity(\n      category: $category\n      date: $date\n      description: $description\n      id: $id\n      movement: $movement\n      name: $name\n      project: $project\n      subcategory: $subcategory\n      transactions: $transactions\n      type: $type\n    ) {\n      id\n      number\n      liabilities {\n        account\n        linkId\n      }\n    }\n  }\n": types.CreateActivityDocument,
    "\n  mutation UpdateActivity(\n    $id: UUID!\n    $category: UUID\n    $date: Date\n    $description: String\n    $name: String\n    $project: UUID\n    $subcategory: UUID\n    $type: String\n  ) {\n    updateActivity(\n      id: $id\n      category: $category\n      date: $date\n      description: $description\n      name: $name\n      project: $project\n      subcategory: $subcategory\n      type: $type\n    ) {\n      id\n    }\n  }\n": types.UpdateActivityDocument,
    "\n  mutation DeleteActivity($id: UUID!) {\n    deleteActivity(id: $id) {\n      success\n    }\n  }\n": types.DeleteActivityDocument,
    "\n  mutation AddTransaction(\n    $activityId: UUID!\n    $id: UUID!\n    $amount: Float!\n    $fromAccount: UUID!\n    $toAccount: UUID!\n  ) {\n    addTransaction(\n      activityId: $activityId\n      id: $id\n      amount: $amount\n      fromAccount: $fromAccount\n      toAccount: $toAccount\n    ) {\n      id\n      liabilities {\n        account\n        linkId\n      }\n    }\n  }\n": types.AddTransactionDocument,
    "\n  mutation UpdateTransaction(\n    $activityId: UUID!\n    $id: UUID!\n    $amount: Float\n    $fromAccount: UUID\n    $toAccount: UUID\n  ) {\n    updateTransaction(\n      activityId: $activityId\n      id: $id\n      amount: $amount\n      fromAccount: $fromAccount\n      toAccount: $toAccount\n    ) {\n      id\n      liabilities {\n        account\n        linkId\n      }\n    }\n  }\n": types.UpdateTransactionDocument,
    "\n  mutation DeleteTransaction($activityId: UUID!, $id: UUID!) {\n    deleteTransaction(activityId: $activityId, id: $id) {\n      success\n    }\n  }\n": types.DeleteTransactionDocument,
    "\n  mutation CreateActivityCategory($id: UUID!, $name: String!, $type: String!) {\n    createActivityCategory(id: $id, name: $name, type: $type) {\n      id\n    }\n  }\n": types.CreateActivityCategoryDocument,
    "\n  mutation UpdateActivityCategory($id: UUID!, $name: String!) {\n    updateActivityCategory(id: $id, name: $name) {\n      id\n    }\n  }\n": types.UpdateActivityCategoryDocument,
    "\n  mutation DeleteActivityCategory($id: UUID!) {\n    deleteActivityCategory(id: $id) {\n      success\n    }\n  }\n": types.DeleteActivityCategoryDocument,
    "\n  mutation CreateActivitySubCategory(\n    $id: UUID!\n    $name: String!\n    $category: UUID!\n  ) {\n    createActivitySubCategory(id: $id, name: $name, category: $category) {\n      id\n    }\n  }\n": types.CreateActivitySubCategoryDocument,
    "\n  mutation UpdateActivitySubCategory($id: UUID!, $name: String!) {\n    updateActivitySubCategory(id: $id, name: $name) {\n      id\n    }\n  }\n": types.UpdateActivitySubCategoryDocument,
    "\n  mutation DeleteActivitySubCategory($id: UUID!) {\n    deleteActivitySubCategory(id: $id) {\n      success\n    }\n  }\n": types.DeleteActivitySubCategoryDocument,
    "\n  mutation CreateMovement(\n    $id: UUID!\n    $date: Date!\n    $name: String!\n    $account: UUID!\n    $amount: Float!\n  ) {\n    createMovement(\n      id: $id\n      date: $date\n      name: $name\n      account: $account\n      amount: $amount\n    ) {\n      id\n    }\n  }\n": types.CreateMovementDocument,
    "\n  mutation UpdateMovement($id: UUID!, $date: Date, $amount: Float) {\n    updateMovement(id: $id, date: $date, amount: $amount) {\n      id\n    }\n  }\n": types.UpdateMovementDocument,
    "\n  mutation DeleteMovement($id: UUID!) {\n    deleteMovement(id: $id) {\n      success\n    }\n  }\n": types.DeleteMovementDocument,
    "\n  mutation CreateMovementActivity($id: UUID!, $movementId: UUID!, $activityId: UUID!, $amount: Float!) {\n    createMovementActivity(id: $id, movementId: $movementId, activityId: $activityId, amount: $amount) {\n      id\n    }\n  }\n": types.CreateMovementActivityDocument,
    "\n  mutation UpdateMovementActivity($id: UUID!, $amount: Float!) {\n    updateMovementActivity(id: $id, amount: $amount) {\n      id\n    }\n  }\n": types.UpdateMovementActivityDocument,
    "\n  mutation DeleteMovementActivity($id: UUID!) {\n    deleteMovementActivity(id: $id) {\n      success\n    }\n  }\n": types.DeleteMovementActivityDocument,
    "\n  mutation CreateProject($id: UUID!, $name: String!, $emoji: String) {\n    createProject(id: $id, name: $name, emoji: $emoji) {\n      id\n    }\n  }\n": types.CreateProjectDocument,
    "\n  mutation UpdateProject(\n    $id: UUID!\n    $name: String\n    $emoji: String\n    $startDate: Date\n    $endDate: Date\n  ) {\n    updateProject(\n      id: $id\n      name: $name\n      emoji: $emoji\n      startDate: $startDate\n      endDate: $endDate\n    ) {\n      id\n    }\n  }\n": types.UpdateProjectDocument,
    "\n  mutation DeleteProject($id: UUID!) {\n    deleteProject(id: $id)\n  }\n": types.DeleteProjectDocument,
    "\n      query MissingEvents($lastSync: Float!) {\n        events(lastSync: $lastSync) {\n          type\n          payload\n          createdAt\n          clientId\n        }\n      }\n    ": types.MissingEventsDocument,
    "\n    query InitialData {\n      activities {\n        id\n        number\n        name\n        description\n        date\n        type\n        category\n        subcategory\n        project\n        transactions {\n          id\n          amount\n          fromAccount\n          toAccount\n        }\n        movements {\n          id\n          movement\n          amount\n        }\n        amount\n        status\n      }\n\n      activityCategories {\n        id\n        name\n        type\n      }\n\n      activitySubcategories {\n        id\n        name\n        category\n      }\n\n      accounts {\n        id\n        name\n        type\n        default\n        startingBalance\n        startingCashBalance\n        movements\n      }\n\n      settings {\n        startingPeriod\n        currency\n      }\n\n      movements {\n        id\n        date\n        amount\n        account\n        name\n        activities {\n          id\n          activity\n          amount\n        }\n        status\n      }\n\n      contacts {\n        id\n        contact\n        contactEmail\n        approved\n        liabilityAccount\n      }\n\n      liabilities {\n        activity\n        amount\n        account\n        name\n        date\n        status\n        linkedAmount\n        linkId\n      }\n\n      projects {\n        id\n        name\n        emoji\n        startDate\n        endDate\n      }\n    }\n  ": types.InitialDataDocument,
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
export function graphql(source: "\n  mutation CreateActivity(\n    $category: UUID\n    $date: Date!\n    $description: String\n    $id: UUID!\n    $movement: ActivityMovementInput\n    $name: String!\n    $project: UUID\n    $subcategory: UUID\n    $transactions: [TransactionInput!]\n    $type: String!\n  ) {\n    createActivity(\n      category: $category\n      date: $date\n      description: $description\n      id: $id\n      movement: $movement\n      name: $name\n      project: $project\n      subcategory: $subcategory\n      transactions: $transactions\n      type: $type\n    ) {\n      id\n      number\n      liabilities {\n        account\n        linkId\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateActivity(\n    $category: UUID\n    $date: Date!\n    $description: String\n    $id: UUID!\n    $movement: ActivityMovementInput\n    $name: String!\n    $project: UUID\n    $subcategory: UUID\n    $transactions: [TransactionInput!]\n    $type: String!\n  ) {\n    createActivity(\n      category: $category\n      date: $date\n      description: $description\n      id: $id\n      movement: $movement\n      name: $name\n      project: $project\n      subcategory: $subcategory\n      transactions: $transactions\n      type: $type\n    ) {\n      id\n      number\n      liabilities {\n        account\n        linkId\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateActivity(\n    $id: UUID!\n    $category: UUID\n    $date: Date\n    $description: String\n    $name: String\n    $project: UUID\n    $subcategory: UUID\n    $type: String\n  ) {\n    updateActivity(\n      id: $id\n      category: $category\n      date: $date\n      description: $description\n      name: $name\n      project: $project\n      subcategory: $subcategory\n      type: $type\n    ) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateActivity(\n    $id: UUID!\n    $category: UUID\n    $date: Date\n    $description: String\n    $name: String\n    $project: UUID\n    $subcategory: UUID\n    $type: String\n  ) {\n    updateActivity(\n      id: $id\n      category: $category\n      date: $date\n      description: $description\n      name: $name\n      project: $project\n      subcategory: $subcategory\n      type: $type\n    ) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteActivity($id: UUID!) {\n    deleteActivity(id: $id) {\n      success\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteActivity($id: UUID!) {\n    deleteActivity(id: $id) {\n      success\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AddTransaction(\n    $activityId: UUID!\n    $id: UUID!\n    $amount: Float!\n    $fromAccount: UUID!\n    $toAccount: UUID!\n  ) {\n    addTransaction(\n      activityId: $activityId\n      id: $id\n      amount: $amount\n      fromAccount: $fromAccount\n      toAccount: $toAccount\n    ) {\n      id\n      liabilities {\n        account\n        linkId\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation AddTransaction(\n    $activityId: UUID!\n    $id: UUID!\n    $amount: Float!\n    $fromAccount: UUID!\n    $toAccount: UUID!\n  ) {\n    addTransaction(\n      activityId: $activityId\n      id: $id\n      amount: $amount\n      fromAccount: $fromAccount\n      toAccount: $toAccount\n    ) {\n      id\n      liabilities {\n        account\n        linkId\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateTransaction(\n    $activityId: UUID!\n    $id: UUID!\n    $amount: Float\n    $fromAccount: UUID\n    $toAccount: UUID\n  ) {\n    updateTransaction(\n      activityId: $activityId\n      id: $id\n      amount: $amount\n      fromAccount: $fromAccount\n      toAccount: $toAccount\n    ) {\n      id\n      liabilities {\n        account\n        linkId\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateTransaction(\n    $activityId: UUID!\n    $id: UUID!\n    $amount: Float\n    $fromAccount: UUID\n    $toAccount: UUID\n  ) {\n    updateTransaction(\n      activityId: $activityId\n      id: $id\n      amount: $amount\n      fromAccount: $fromAccount\n      toAccount: $toAccount\n    ) {\n      id\n      liabilities {\n        account\n        linkId\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteTransaction($activityId: UUID!, $id: UUID!) {\n    deleteTransaction(activityId: $activityId, id: $id) {\n      success\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteTransaction($activityId: UUID!, $id: UUID!) {\n    deleteTransaction(activityId: $activityId, id: $id) {\n      success\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateActivityCategory($id: UUID!, $name: String!, $type: String!) {\n    createActivityCategory(id: $id, name: $name, type: $type) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateActivityCategory($id: UUID!, $name: String!, $type: String!) {\n    createActivityCategory(id: $id, name: $name, type: $type) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateActivityCategory($id: UUID!, $name: String!) {\n    updateActivityCategory(id: $id, name: $name) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateActivityCategory($id: UUID!, $name: String!) {\n    updateActivityCategory(id: $id, name: $name) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteActivityCategory($id: UUID!) {\n    deleteActivityCategory(id: $id) {\n      success\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteActivityCategory($id: UUID!) {\n    deleteActivityCategory(id: $id) {\n      success\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateActivitySubCategory(\n    $id: UUID!\n    $name: String!\n    $category: UUID!\n  ) {\n    createActivitySubCategory(id: $id, name: $name, category: $category) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateActivitySubCategory(\n    $id: UUID!\n    $name: String!\n    $category: UUID!\n  ) {\n    createActivitySubCategory(id: $id, name: $name, category: $category) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateActivitySubCategory($id: UUID!, $name: String!) {\n    updateActivitySubCategory(id: $id, name: $name) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateActivitySubCategory($id: UUID!, $name: String!) {\n    updateActivitySubCategory(id: $id, name: $name) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteActivitySubCategory($id: UUID!) {\n    deleteActivitySubCategory(id: $id) {\n      success\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteActivitySubCategory($id: UUID!) {\n    deleteActivitySubCategory(id: $id) {\n      success\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateMovement(\n    $id: UUID!\n    $date: Date!\n    $name: String!\n    $account: UUID!\n    $amount: Float!\n  ) {\n    createMovement(\n      id: $id\n      date: $date\n      name: $name\n      account: $account\n      amount: $amount\n    ) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateMovement(\n    $id: UUID!\n    $date: Date!\n    $name: String!\n    $account: UUID!\n    $amount: Float!\n  ) {\n    createMovement(\n      id: $id\n      date: $date\n      name: $name\n      account: $account\n      amount: $amount\n    ) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateMovement($id: UUID!, $date: Date, $amount: Float) {\n    updateMovement(id: $id, date: $date, amount: $amount) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateMovement($id: UUID!, $date: Date, $amount: Float) {\n    updateMovement(id: $id, date: $date, amount: $amount) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteMovement($id: UUID!) {\n    deleteMovement(id: $id) {\n      success\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteMovement($id: UUID!) {\n    deleteMovement(id: $id) {\n      success\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateMovementActivity($id: UUID!, $movementId: UUID!, $activityId: UUID!, $amount: Float!) {\n    createMovementActivity(id: $id, movementId: $movementId, activityId: $activityId, amount: $amount) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateMovementActivity($id: UUID!, $movementId: UUID!, $activityId: UUID!, $amount: Float!) {\n    createMovementActivity(id: $id, movementId: $movementId, activityId: $activityId, amount: $amount) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateMovementActivity($id: UUID!, $amount: Float!) {\n    updateMovementActivity(id: $id, amount: $amount) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateMovementActivity($id: UUID!, $amount: Float!) {\n    updateMovementActivity(id: $id, amount: $amount) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteMovementActivity($id: UUID!) {\n    deleteMovementActivity(id: $id) {\n      success\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteMovementActivity($id: UUID!) {\n    deleteMovementActivity(id: $id) {\n      success\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateProject($id: UUID!, $name: String!, $emoji: String) {\n    createProject(id: $id, name: $name, emoji: $emoji) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateProject($id: UUID!, $name: String!, $emoji: String) {\n    createProject(id: $id, name: $name, emoji: $emoji) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateProject(\n    $id: UUID!\n    $name: String\n    $emoji: String\n    $startDate: Date\n    $endDate: Date\n  ) {\n    updateProject(\n      id: $id\n      name: $name\n      emoji: $emoji\n      startDate: $startDate\n      endDate: $endDate\n    ) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateProject(\n    $id: UUID!\n    $name: String\n    $emoji: String\n    $startDate: Date\n    $endDate: Date\n  ) {\n    updateProject(\n      id: $id\n      name: $name\n      emoji: $emoji\n      startDate: $startDate\n      endDate: $endDate\n    ) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteProject($id: UUID!) {\n    deleteProject(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteProject($id: UUID!) {\n    deleteProject(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n      query MissingEvents($lastSync: Float!) {\n        events(lastSync: $lastSync) {\n          type\n          payload\n          createdAt\n          clientId\n        }\n      }\n    "): (typeof documents)["\n      query MissingEvents($lastSync: Float!) {\n        events(lastSync: $lastSync) {\n          type\n          payload\n          createdAt\n          clientId\n        }\n      }\n    "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query InitialData {\n      activities {\n        id\n        number\n        name\n        description\n        date\n        type\n        category\n        subcategory\n        project\n        transactions {\n          id\n          amount\n          fromAccount\n          toAccount\n        }\n        movements {\n          id\n          movement\n          amount\n        }\n        amount\n        status\n      }\n\n      activityCategories {\n        id\n        name\n        type\n      }\n\n      activitySubcategories {\n        id\n        name\n        category\n      }\n\n      accounts {\n        id\n        name\n        type\n        default\n        startingBalance\n        startingCashBalance\n        movements\n      }\n\n      settings {\n        startingPeriod\n        currency\n      }\n\n      movements {\n        id\n        date\n        amount\n        account\n        name\n        activities {\n          id\n          activity\n          amount\n        }\n        status\n      }\n\n      contacts {\n        id\n        contact\n        contactEmail\n        approved\n        liabilityAccount\n      }\n\n      liabilities {\n        activity\n        amount\n        account\n        name\n        date\n        status\n        linkedAmount\n        linkId\n      }\n\n      projects {\n        id\n        name\n        emoji\n        startDate\n        endDate\n      }\n    }\n  "): (typeof documents)["\n    query InitialData {\n      activities {\n        id\n        number\n        name\n        description\n        date\n        type\n        category\n        subcategory\n        project\n        transactions {\n          id\n          amount\n          fromAccount\n          toAccount\n        }\n        movements {\n          id\n          movement\n          amount\n        }\n        amount\n        status\n      }\n\n      activityCategories {\n        id\n        name\n        type\n      }\n\n      activitySubcategories {\n        id\n        name\n        category\n      }\n\n      accounts {\n        id\n        name\n        type\n        default\n        startingBalance\n        startingCashBalance\n        movements\n      }\n\n      settings {\n        startingPeriod\n        currency\n      }\n\n      movements {\n        id\n        date\n        amount\n        account\n        name\n        activities {\n          id\n          activity\n          amount\n        }\n        status\n      }\n\n      contacts {\n        id\n        contact\n        contactEmail\n        approved\n        liabilityAccount\n      }\n\n      liabilities {\n        activity\n        amount\n        account\n        name\n        date\n        status\n        linkedAmount\n        linkId\n      }\n\n      projects {\n        id\n        name\n        emoji\n        startDate\n        endDate\n      }\n    }\n  "];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;