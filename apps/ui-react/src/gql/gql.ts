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
    "\n  mutation CreateContact(\n    $id: String!\n    $contact: String!\n  ) {\n    createContact(\n      id: $id\n      contact: $contact\n    ) {\n      id\n      createdAt\n      contact {\n        id\n        email\n        name\n        image\n      }\n    }\n  }\n": typeof types.CreateContactDocument,
    "\n  query UserData {\n    activities {\n      id\n      number\n      name\n      description\n      date\n      type\n      category\n      subcategory\n      project\n      transactions {\n        id\n        amount\n        fromAccount\n        fromAsset\n        fromCounterparty\n        toAccount\n        toAsset\n        toCounterparty\n      }\n      movements {\n        id\n        movement\n        amount\n      }\n      amount\n      status\n      sharing { \n        user\n        liability\n        accounts {\n          account\n          amount\n        }\n      }\n    }\n\n    activityCategories {\n      id\n      name\n      type\n      emoji\n    }\n\n    activitySubcategories {\n      id\n      name\n      category\n      emoji\n    }\n\n    accounts {\n      id\n      name\n      type\n      default\n      startingBalance\n      startingCashBalance\n      movements\n      sharing {\n        role\n        sharedWith\n        proportion\n      }\n    }\n\n    movements {\n      id\n      date\n      amount\n      account\n      name\n      activities {\n        id\n        activity\n        amount\n      }\n      status\n    }\n\n    projects {\n      id\n      name\n      emoji\n      startDate\n      endDate\n    }\n\n    assets {\n      id\n      account\n      name\n      description\n      location\n    }\n    \n    counterparties {\n      id\n      account\n      name\n      description\n      contact\n    }\n    \n    contacts {\n      id\n      contact {\n        id\n        name\n        email\n        image\n      }\n      createdAt\n    }\n  }\n": typeof types.UserDataDocument,
    "\n  mutation CreateAccount(\n    $id: String!\n    $name: String!\n    $type: String!\n    $startingBalance: Float\n    $startingCashBalance: Float\n    $movements: Boolean\n  ) {\n    createAccount(id: $id, name: $name, type: $type,\n      startingBalance: $startingBalance,\n      startingCashBalance: $startingCashBalance,\n      movements: $movements\n    ) {\n      id\n    }\n  }\n": typeof types.CreateAccountDocument,
    "\n  mutation UpdateAccount(\n    $id: String!\n    $name: String\n    $startingBalance: Float\n    $startingCashBalance: Float\n    $movements: Boolean\n  ) {\n    updateAccount(\n      id: $id\n      name: $name\n      startingBalance: $startingBalance\n      startingCashBalance: $startingCashBalance\n      movements: $movements\n    ) {\n      id\n    }\n  }\n": typeof types.UpdateAccountDocument,
    "\n  mutation DeleteAccount($id: String!) {\n    deleteAccount(id: $id) {\n      success\n    }\n  }\n": typeof types.DeleteAccountDocument,
    "\n  mutation ShareAccount($id: String!, $userId: String!) {\n    shareAccount(id: $id, userId: $userId) {\n      id\n      sharing {\n        role\n        sharedWith\n        proportion\n      }\n    }\n  }\n": typeof types.ShareAccountDocument,
    "\n  mutation CreateActivity(\n    $category: String\n    $date: Date!\n    $description: String\n    $id: String!\n    $movement: ActivityMovementInput\n    $name: String!\n    $project: String\n    $subcategory: String\n    $transactions: [TransactionInput!]\n    $type: String!\n  ) {\n    createActivity(\n      category: $category\n      date: $date\n      description: $description\n      id: $id\n      movement: $movement\n      name: $name\n      project: $project\n      subcategory: $subcategory\n      transactions: $transactions\n      type: $type\n    ) {\n      id\n      number\n    }\n  }\n": typeof types.CreateActivityDocument,
    "\n  mutation UpdateActivity(\n    $id: String!\n    $category: String\n    $date: Date\n    $description: String\n    $name: String\n    $project: String\n    $subcategory: String\n    $type: String\n  ) {\n    updateActivity(\n      id: $id\n      category: $category\n      date: $date\n      description: $description\n      name: $name\n      project: $project\n      subcategory: $subcategory\n      type: $type\n    ) {\n      id\n    }\n  }\n": typeof types.UpdateActivityDocument,
    "\n  mutation DeleteActivity($id: String!) {\n    deleteActivity(id: $id) {\n      success\n    }\n  }\n": typeof types.DeleteActivityDocument,
    "\n  mutation ShareActivity(\n    $id: String!\n    $userId: String!\n  ) {\n    shareActivity(\n      id: $id\n      userId: $userId\n    ) {\n      user\n      liability\n      accounts {\n        account\n        amount\n      }\n    }\n  }\n": typeof types.ShareActivityDocument,
    "\n  mutation AddTransaction(\n    $activityId: String!\n    $id: String!\n    $amount: Float!\n    $fromAccount: String!\n    $toAccount: String!\n  ) {\n    addTransaction(\n      activityId: $activityId\n      id: $id\n      amount: $amount\n      fromAccount: $fromAccount\n      toAccount: $toAccount\n    ) {\n      id\n    }\n  }\n": typeof types.AddTransactionDocument,
    "\n  mutation UpdateTransaction(\n    $activityId: String!\n    $id: String!\n    $amount: Float\n    $fromAccount: String\n    $fromAsset: String\n    $fromCounterparty: String\n    $toAccount: String\n    $toAsset: String\n    $toCounterparty: String\n  ) {\n    updateTransaction(\n      activityId: $activityId\n      id: $id\n      amount: $amount\n      fromAccount: $fromAccount\n      fromAsset: $fromAsset\n      fromCounterparty: $fromCounterparty\n      toAccount: $toAccount\n      toAsset: $toAsset\n      toCounterparty: $toCounterparty\n    ) {\n      id\n    }\n  }\n": typeof types.UpdateTransactionDocument,
    "\n  mutation DeleteTransaction($activityId: String!, $id: String!) {\n    deleteTransaction(activityId: $activityId, id: $id) {\n      success\n    }\n  }\n": typeof types.DeleteTransactionDocument,
    "\n  mutation CreateActivityCategory(\n    $id: String!\n    $name: String!\n    $type: String!\n    $emoji: String\n  ) {\n    createActivityCategory(\n      id: $id\n      name: $name\n      type: $type\n      emoji: $emoji\n    ) {\n      id\n    }\n  }\n": typeof types.CreateActivityCategoryDocument,
    "\n  mutation UpdateActivityCategory($id: String!, $name: String!, $emoji: String) {\n    updateActivityCategory(id: $id, name: $name, emoji: $emoji) {\n      id\n    }\n  }\n": typeof types.UpdateActivityCategoryDocument,
    "\n  mutation DeleteActivityCategory($id: String!) {\n    deleteActivityCategory(id: $id) {\n      success\n    }\n  }\n": typeof types.DeleteActivityCategoryDocument,
    "\n  mutation CreateActivitySubCategory(\n    $id: String!\n    $name: String!\n    $category: String!\n    $emoji: String\n  ) {\n    createActivitySubCategory(\n      id: $id\n      name: $name\n      category: $category\n      emoji: $emoji\n    ) {\n      id\n    }\n  }\n": typeof types.CreateActivitySubCategoryDocument,
    "\n  mutation UpdateActivitySubCategory($id: String!, $name: String!, $emoji: String) {\n    updateActivitySubCategory(id: $id, name: $name, emoji: $emoji) {\n      id\n    }\n  }\n": typeof types.UpdateActivitySubCategoryDocument,
    "\n  mutation DeleteActivitySubCategory($id: String!) {\n    deleteActivitySubCategory(id: $id) {\n      success\n    }\n  }\n": typeof types.DeleteActivitySubCategoryDocument,
    "\n  mutation CreateAsset(\n    $id: String!\n    $account: String!\n    $name: String!\n    $description: String\n    $location: String\n  ) {\n    createAsset(\n      id: $id\n      account: $account\n      name: $name\n      description: $description\n      location: $location\n    ) {\n      id\n    }\n  }\n": typeof types.CreateAssetDocument,
    "\n  mutation UpdateAsset(\n    $id: String!\n    $name: String\n    $description: String\n    $location: String\n  ) {\n    updateAsset(\n      id: $id\n      name: $name\n      description: $description\n      location: $location\n    ) {\n      id\n      name\n      description\n      location\n    }\n  }\n": typeof types.UpdateAssetDocument,
    "\n  mutation DeleteAsset($id: String!) {\n    deleteAsset(id: $id) {\n      id\n    }\n  }\n": typeof types.DeleteAssetDocument,
    "\n  mutation DeleteContact(\n    $id: String!\n  ) {\n    deleteContact(\n      id: $id\n    )\n  }\n": typeof types.DeleteContactDocument,
    "\n  mutation CreateCounterparty(\n    $id: String!\n    $account: String!\n    $name: String!\n    $description: String\n    $contact: String\n  ) {\n    createCounterparty(\n      id: $id\n      account: $account\n      name: $name\n      description: $description\n      contact: $contact\n    ) {\n      id\n    }\n  }\n": typeof types.CreateCounterpartyDocument,
    "\n  mutation UpdateCounterparty(\n    $id: String!\n    $name: String\n    $description: String\n    $contact: String\n  ) {\n    updateCounterparty(\n      id: $id\n      name: $name\n      description: $description\n      contact: $contact\n    ) {\n      id\n    }\n  }\n": typeof types.UpdateCounterpartyDocument,
    "\n  mutation DeleteCounterparty(\n    $id: String!\n  ) {\n    deleteCounterparty(\n      id: $id\n    )\n  }\n": typeof types.DeleteCounterpartyDocument,
    "\n  mutation CreateMovement(\n    $id: String!\n    $date: Date!\n    $name: String!\n    $account: String!\n    $amount: Float!\n  ) {\n    createMovement(\n      id: $id\n      date: $date\n      name: $name\n      account: $account\n      amount: $amount\n    ) {\n      id\n    }\n  }\n": typeof types.CreateMovementDocument,
    "\n  mutation UpdateMovement($id: String!, $date: Date, $amount: Float, $name: String, $account: String) {\n    updateMovement(id: $id, date: $date, amount: $amount, name: $name, account: $account) {\n      id\n    }\n  }\n": typeof types.UpdateMovementDocument,
    "\n  mutation DeleteMovement($id: String!) {\n      deleteMovement(id: $id) {\n      success\n    }\n  }\n": typeof types.DeleteMovementDocument,
    "\n  mutation CreateMovementActivity(\n    $id: String!\n    $movementId: String!\n    $activityId: String!\n    $amount: Float!\n  ) {\n    createMovementActivity(\n      id: $id\n      movementId: $movementId\n      activityId: $activityId\n      amount: $amount\n    ) {\n      id\n    }\n  }\n": typeof types.CreateMovementActivityDocument,
    "\n  mutation UpdateMovementActivity($id: String!, $amount: Float!) {\n    updateMovementActivity(id: $id, amount: $amount) {\n      id\n    }\n  }\n": typeof types.UpdateMovementActivityDocument,
    "\n  mutation DeleteMovementActivity($id: String!) {\n    deleteMovementActivity(id: $id) {\n      success\n    }\n  }\n": typeof types.DeleteMovementActivityDocument,
    "\n  mutation CreateProject(\n    $id: String!\n    $name: String!\n    $emoji: String\n  ) {\n    createProject(id: $id, name: $name, emoji: $emoji) {\n      id\n    }\n  }\n": typeof types.CreateProjectDocument,
    "\n  mutation UpdateProject(\n    $id: String!\n    $name: String\n    $emoji: String\n    $startDate: Date\n    $endDate: Date\n  ) {\n    updateProject(\n      id: $id\n      name: $name\n      emoji: $emoji\n      startDate: $startDate\n      endDate: $endDate\n    ) {\n      id\n    }\n  }\n": typeof types.UpdateProjectDocument,
    "\n  mutation DeleteProject($id: String!) {\n    deleteProject(id: $id)\n  }\n": typeof types.DeleteProjectDocument,
    "\n  query MissingEvents(\n      $lastSync: Float!,\n  ) {\n    events(lastSync: $lastSync) {\n      type\n      payload\n      createdAt\n      clientId\n    }\n  }\n": typeof types.MissingEventsDocument,
};
const documents: Documents = {
    "\n  mutation CreateContact(\n    $id: String!\n    $contact: String!\n  ) {\n    createContact(\n      id: $id\n      contact: $contact\n    ) {\n      id\n      createdAt\n      contact {\n        id\n        email\n        name\n        image\n      }\n    }\n  }\n": types.CreateContactDocument,
    "\n  query UserData {\n    activities {\n      id\n      number\n      name\n      description\n      date\n      type\n      category\n      subcategory\n      project\n      transactions {\n        id\n        amount\n        fromAccount\n        fromAsset\n        fromCounterparty\n        toAccount\n        toAsset\n        toCounterparty\n      }\n      movements {\n        id\n        movement\n        amount\n      }\n      amount\n      status\n      sharing { \n        user\n        liability\n        accounts {\n          account\n          amount\n        }\n      }\n    }\n\n    activityCategories {\n      id\n      name\n      type\n      emoji\n    }\n\n    activitySubcategories {\n      id\n      name\n      category\n      emoji\n    }\n\n    accounts {\n      id\n      name\n      type\n      default\n      startingBalance\n      startingCashBalance\n      movements\n      sharing {\n        role\n        sharedWith\n        proportion\n      }\n    }\n\n    movements {\n      id\n      date\n      amount\n      account\n      name\n      activities {\n        id\n        activity\n        amount\n      }\n      status\n    }\n\n    projects {\n      id\n      name\n      emoji\n      startDate\n      endDate\n    }\n\n    assets {\n      id\n      account\n      name\n      description\n      location\n    }\n    \n    counterparties {\n      id\n      account\n      name\n      description\n      contact\n    }\n    \n    contacts {\n      id\n      contact {\n        id\n        name\n        email\n        image\n      }\n      createdAt\n    }\n  }\n": types.UserDataDocument,
    "\n  mutation CreateAccount(\n    $id: String!\n    $name: String!\n    $type: String!\n    $startingBalance: Float\n    $startingCashBalance: Float\n    $movements: Boolean\n  ) {\n    createAccount(id: $id, name: $name, type: $type,\n      startingBalance: $startingBalance,\n      startingCashBalance: $startingCashBalance,\n      movements: $movements\n    ) {\n      id\n    }\n  }\n": types.CreateAccountDocument,
    "\n  mutation UpdateAccount(\n    $id: String!\n    $name: String\n    $startingBalance: Float\n    $startingCashBalance: Float\n    $movements: Boolean\n  ) {\n    updateAccount(\n      id: $id\n      name: $name\n      startingBalance: $startingBalance\n      startingCashBalance: $startingCashBalance\n      movements: $movements\n    ) {\n      id\n    }\n  }\n": types.UpdateAccountDocument,
    "\n  mutation DeleteAccount($id: String!) {\n    deleteAccount(id: $id) {\n      success\n    }\n  }\n": types.DeleteAccountDocument,
    "\n  mutation ShareAccount($id: String!, $userId: String!) {\n    shareAccount(id: $id, userId: $userId) {\n      id\n      sharing {\n        role\n        sharedWith\n        proportion\n      }\n    }\n  }\n": types.ShareAccountDocument,
    "\n  mutation CreateActivity(\n    $category: String\n    $date: Date!\n    $description: String\n    $id: String!\n    $movement: ActivityMovementInput\n    $name: String!\n    $project: String\n    $subcategory: String\n    $transactions: [TransactionInput!]\n    $type: String!\n  ) {\n    createActivity(\n      category: $category\n      date: $date\n      description: $description\n      id: $id\n      movement: $movement\n      name: $name\n      project: $project\n      subcategory: $subcategory\n      transactions: $transactions\n      type: $type\n    ) {\n      id\n      number\n    }\n  }\n": types.CreateActivityDocument,
    "\n  mutation UpdateActivity(\n    $id: String!\n    $category: String\n    $date: Date\n    $description: String\n    $name: String\n    $project: String\n    $subcategory: String\n    $type: String\n  ) {\n    updateActivity(\n      id: $id\n      category: $category\n      date: $date\n      description: $description\n      name: $name\n      project: $project\n      subcategory: $subcategory\n      type: $type\n    ) {\n      id\n    }\n  }\n": types.UpdateActivityDocument,
    "\n  mutation DeleteActivity($id: String!) {\n    deleteActivity(id: $id) {\n      success\n    }\n  }\n": types.DeleteActivityDocument,
    "\n  mutation ShareActivity(\n    $id: String!\n    $userId: String!\n  ) {\n    shareActivity(\n      id: $id\n      userId: $userId\n    ) {\n      user\n      liability\n      accounts {\n        account\n        amount\n      }\n    }\n  }\n": types.ShareActivityDocument,
    "\n  mutation AddTransaction(\n    $activityId: String!\n    $id: String!\n    $amount: Float!\n    $fromAccount: String!\n    $toAccount: String!\n  ) {\n    addTransaction(\n      activityId: $activityId\n      id: $id\n      amount: $amount\n      fromAccount: $fromAccount\n      toAccount: $toAccount\n    ) {\n      id\n    }\n  }\n": types.AddTransactionDocument,
    "\n  mutation UpdateTransaction(\n    $activityId: String!\n    $id: String!\n    $amount: Float\n    $fromAccount: String\n    $fromAsset: String\n    $fromCounterparty: String\n    $toAccount: String\n    $toAsset: String\n    $toCounterparty: String\n  ) {\n    updateTransaction(\n      activityId: $activityId\n      id: $id\n      amount: $amount\n      fromAccount: $fromAccount\n      fromAsset: $fromAsset\n      fromCounterparty: $fromCounterparty\n      toAccount: $toAccount\n      toAsset: $toAsset\n      toCounterparty: $toCounterparty\n    ) {\n      id\n    }\n  }\n": types.UpdateTransactionDocument,
    "\n  mutation DeleteTransaction($activityId: String!, $id: String!) {\n    deleteTransaction(activityId: $activityId, id: $id) {\n      success\n    }\n  }\n": types.DeleteTransactionDocument,
    "\n  mutation CreateActivityCategory(\n    $id: String!\n    $name: String!\n    $type: String!\n    $emoji: String\n  ) {\n    createActivityCategory(\n      id: $id\n      name: $name\n      type: $type\n      emoji: $emoji\n    ) {\n      id\n    }\n  }\n": types.CreateActivityCategoryDocument,
    "\n  mutation UpdateActivityCategory($id: String!, $name: String!, $emoji: String) {\n    updateActivityCategory(id: $id, name: $name, emoji: $emoji) {\n      id\n    }\n  }\n": types.UpdateActivityCategoryDocument,
    "\n  mutation DeleteActivityCategory($id: String!) {\n    deleteActivityCategory(id: $id) {\n      success\n    }\n  }\n": types.DeleteActivityCategoryDocument,
    "\n  mutation CreateActivitySubCategory(\n    $id: String!\n    $name: String!\n    $category: String!\n    $emoji: String\n  ) {\n    createActivitySubCategory(\n      id: $id\n      name: $name\n      category: $category\n      emoji: $emoji\n    ) {\n      id\n    }\n  }\n": types.CreateActivitySubCategoryDocument,
    "\n  mutation UpdateActivitySubCategory($id: String!, $name: String!, $emoji: String) {\n    updateActivitySubCategory(id: $id, name: $name, emoji: $emoji) {\n      id\n    }\n  }\n": types.UpdateActivitySubCategoryDocument,
    "\n  mutation DeleteActivitySubCategory($id: String!) {\n    deleteActivitySubCategory(id: $id) {\n      success\n    }\n  }\n": types.DeleteActivitySubCategoryDocument,
    "\n  mutation CreateAsset(\n    $id: String!\n    $account: String!\n    $name: String!\n    $description: String\n    $location: String\n  ) {\n    createAsset(\n      id: $id\n      account: $account\n      name: $name\n      description: $description\n      location: $location\n    ) {\n      id\n    }\n  }\n": types.CreateAssetDocument,
    "\n  mutation UpdateAsset(\n    $id: String!\n    $name: String\n    $description: String\n    $location: String\n  ) {\n    updateAsset(\n      id: $id\n      name: $name\n      description: $description\n      location: $location\n    ) {\n      id\n      name\n      description\n      location\n    }\n  }\n": types.UpdateAssetDocument,
    "\n  mutation DeleteAsset($id: String!) {\n    deleteAsset(id: $id) {\n      id\n    }\n  }\n": types.DeleteAssetDocument,
    "\n  mutation DeleteContact(\n    $id: String!\n  ) {\n    deleteContact(\n      id: $id\n    )\n  }\n": types.DeleteContactDocument,
    "\n  mutation CreateCounterparty(\n    $id: String!\n    $account: String!\n    $name: String!\n    $description: String\n    $contact: String\n  ) {\n    createCounterparty(\n      id: $id\n      account: $account\n      name: $name\n      description: $description\n      contact: $contact\n    ) {\n      id\n    }\n  }\n": types.CreateCounterpartyDocument,
    "\n  mutation UpdateCounterparty(\n    $id: String!\n    $name: String\n    $description: String\n    $contact: String\n  ) {\n    updateCounterparty(\n      id: $id\n      name: $name\n      description: $description\n      contact: $contact\n    ) {\n      id\n    }\n  }\n": types.UpdateCounterpartyDocument,
    "\n  mutation DeleteCounterparty(\n    $id: String!\n  ) {\n    deleteCounterparty(\n      id: $id\n    )\n  }\n": types.DeleteCounterpartyDocument,
    "\n  mutation CreateMovement(\n    $id: String!\n    $date: Date!\n    $name: String!\n    $account: String!\n    $amount: Float!\n  ) {\n    createMovement(\n      id: $id\n      date: $date\n      name: $name\n      account: $account\n      amount: $amount\n    ) {\n      id\n    }\n  }\n": types.CreateMovementDocument,
    "\n  mutation UpdateMovement($id: String!, $date: Date, $amount: Float, $name: String, $account: String) {\n    updateMovement(id: $id, date: $date, amount: $amount, name: $name, account: $account) {\n      id\n    }\n  }\n": types.UpdateMovementDocument,
    "\n  mutation DeleteMovement($id: String!) {\n      deleteMovement(id: $id) {\n      success\n    }\n  }\n": types.DeleteMovementDocument,
    "\n  mutation CreateMovementActivity(\n    $id: String!\n    $movementId: String!\n    $activityId: String!\n    $amount: Float!\n  ) {\n    createMovementActivity(\n      id: $id\n      movementId: $movementId\n      activityId: $activityId\n      amount: $amount\n    ) {\n      id\n    }\n  }\n": types.CreateMovementActivityDocument,
    "\n  mutation UpdateMovementActivity($id: String!, $amount: Float!) {\n    updateMovementActivity(id: $id, amount: $amount) {\n      id\n    }\n  }\n": types.UpdateMovementActivityDocument,
    "\n  mutation DeleteMovementActivity($id: String!) {\n    deleteMovementActivity(id: $id) {\n      success\n    }\n  }\n": types.DeleteMovementActivityDocument,
    "\n  mutation CreateProject(\n    $id: String!\n    $name: String!\n    $emoji: String\n  ) {\n    createProject(id: $id, name: $name, emoji: $emoji) {\n      id\n    }\n  }\n": types.CreateProjectDocument,
    "\n  mutation UpdateProject(\n    $id: String!\n    $name: String\n    $emoji: String\n    $startDate: Date\n    $endDate: Date\n  ) {\n    updateProject(\n      id: $id\n      name: $name\n      emoji: $emoji\n      startDate: $startDate\n      endDate: $endDate\n    ) {\n      id\n    }\n  }\n": types.UpdateProjectDocument,
    "\n  mutation DeleteProject($id: String!) {\n    deleteProject(id: $id)\n  }\n": types.DeleteProjectDocument,
    "\n  query MissingEvents(\n      $lastSync: Float!,\n  ) {\n    events(lastSync: $lastSync) {\n      type\n      payload\n      createdAt\n      clientId\n    }\n  }\n": types.MissingEventsDocument,
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
export function graphql(source: "\n  mutation CreateContact(\n    $id: String!\n    $contact: String!\n  ) {\n    createContact(\n      id: $id\n      contact: $contact\n    ) {\n      id\n      createdAt\n      contact {\n        id\n        email\n        name\n        image\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateContact(\n    $id: String!\n    $contact: String!\n  ) {\n    createContact(\n      id: $id\n      contact: $contact\n    ) {\n      id\n      createdAt\n      contact {\n        id\n        email\n        name\n        image\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query UserData {\n    activities {\n      id\n      number\n      name\n      description\n      date\n      type\n      category\n      subcategory\n      project\n      transactions {\n        id\n        amount\n        fromAccount\n        fromAsset\n        fromCounterparty\n        toAccount\n        toAsset\n        toCounterparty\n      }\n      movements {\n        id\n        movement\n        amount\n      }\n      amount\n      status\n      sharing { \n        user\n        liability\n        accounts {\n          account\n          amount\n        }\n      }\n    }\n\n    activityCategories {\n      id\n      name\n      type\n      emoji\n    }\n\n    activitySubcategories {\n      id\n      name\n      category\n      emoji\n    }\n\n    accounts {\n      id\n      name\n      type\n      default\n      startingBalance\n      startingCashBalance\n      movements\n      sharing {\n        role\n        sharedWith\n        proportion\n      }\n    }\n\n    movements {\n      id\n      date\n      amount\n      account\n      name\n      activities {\n        id\n        activity\n        amount\n      }\n      status\n    }\n\n    projects {\n      id\n      name\n      emoji\n      startDate\n      endDate\n    }\n\n    assets {\n      id\n      account\n      name\n      description\n      location\n    }\n    \n    counterparties {\n      id\n      account\n      name\n      description\n      contact\n    }\n    \n    contacts {\n      id\n      contact {\n        id\n        name\n        email\n        image\n      }\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  query UserData {\n    activities {\n      id\n      number\n      name\n      description\n      date\n      type\n      category\n      subcategory\n      project\n      transactions {\n        id\n        amount\n        fromAccount\n        fromAsset\n        fromCounterparty\n        toAccount\n        toAsset\n        toCounterparty\n      }\n      movements {\n        id\n        movement\n        amount\n      }\n      amount\n      status\n      sharing { \n        user\n        liability\n        accounts {\n          account\n          amount\n        }\n      }\n    }\n\n    activityCategories {\n      id\n      name\n      type\n      emoji\n    }\n\n    activitySubcategories {\n      id\n      name\n      category\n      emoji\n    }\n\n    accounts {\n      id\n      name\n      type\n      default\n      startingBalance\n      startingCashBalance\n      movements\n      sharing {\n        role\n        sharedWith\n        proportion\n      }\n    }\n\n    movements {\n      id\n      date\n      amount\n      account\n      name\n      activities {\n        id\n        activity\n        amount\n      }\n      status\n    }\n\n    projects {\n      id\n      name\n      emoji\n      startDate\n      endDate\n    }\n\n    assets {\n      id\n      account\n      name\n      description\n      location\n    }\n    \n    counterparties {\n      id\n      account\n      name\n      description\n      contact\n    }\n    \n    contacts {\n      id\n      contact {\n        id\n        name\n        email\n        image\n      }\n      createdAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateAccount(\n    $id: String!\n    $name: String!\n    $type: String!\n    $startingBalance: Float\n    $startingCashBalance: Float\n    $movements: Boolean\n  ) {\n    createAccount(id: $id, name: $name, type: $type,\n      startingBalance: $startingBalance,\n      startingCashBalance: $startingCashBalance,\n      movements: $movements\n    ) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateAccount(\n    $id: String!\n    $name: String!\n    $type: String!\n    $startingBalance: Float\n    $startingCashBalance: Float\n    $movements: Boolean\n  ) {\n    createAccount(id: $id, name: $name, type: $type,\n      startingBalance: $startingBalance,\n      startingCashBalance: $startingCashBalance,\n      movements: $movements\n    ) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateAccount(\n    $id: String!\n    $name: String\n    $startingBalance: Float\n    $startingCashBalance: Float\n    $movements: Boolean\n  ) {\n    updateAccount(\n      id: $id\n      name: $name\n      startingBalance: $startingBalance\n      startingCashBalance: $startingCashBalance\n      movements: $movements\n    ) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateAccount(\n    $id: String!\n    $name: String\n    $startingBalance: Float\n    $startingCashBalance: Float\n    $movements: Boolean\n  ) {\n    updateAccount(\n      id: $id\n      name: $name\n      startingBalance: $startingBalance\n      startingCashBalance: $startingCashBalance\n      movements: $movements\n    ) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteAccount($id: String!) {\n    deleteAccount(id: $id) {\n      success\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteAccount($id: String!) {\n    deleteAccount(id: $id) {\n      success\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ShareAccount($id: String!, $userId: String!) {\n    shareAccount(id: $id, userId: $userId) {\n      id\n      sharing {\n        role\n        sharedWith\n        proportion\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation ShareAccount($id: String!, $userId: String!) {\n    shareAccount(id: $id, userId: $userId) {\n      id\n      sharing {\n        role\n        sharedWith\n        proportion\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateActivity(\n    $category: String\n    $date: Date!\n    $description: String\n    $id: String!\n    $movement: ActivityMovementInput\n    $name: String!\n    $project: String\n    $subcategory: String\n    $transactions: [TransactionInput!]\n    $type: String!\n  ) {\n    createActivity(\n      category: $category\n      date: $date\n      description: $description\n      id: $id\n      movement: $movement\n      name: $name\n      project: $project\n      subcategory: $subcategory\n      transactions: $transactions\n      type: $type\n    ) {\n      id\n      number\n    }\n  }\n"): (typeof documents)["\n  mutation CreateActivity(\n    $category: String\n    $date: Date!\n    $description: String\n    $id: String!\n    $movement: ActivityMovementInput\n    $name: String!\n    $project: String\n    $subcategory: String\n    $transactions: [TransactionInput!]\n    $type: String!\n  ) {\n    createActivity(\n      category: $category\n      date: $date\n      description: $description\n      id: $id\n      movement: $movement\n      name: $name\n      project: $project\n      subcategory: $subcategory\n      transactions: $transactions\n      type: $type\n    ) {\n      id\n      number\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateActivity(\n    $id: String!\n    $category: String\n    $date: Date\n    $description: String\n    $name: String\n    $project: String\n    $subcategory: String\n    $type: String\n  ) {\n    updateActivity(\n      id: $id\n      category: $category\n      date: $date\n      description: $description\n      name: $name\n      project: $project\n      subcategory: $subcategory\n      type: $type\n    ) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateActivity(\n    $id: String!\n    $category: String\n    $date: Date\n    $description: String\n    $name: String\n    $project: String\n    $subcategory: String\n    $type: String\n  ) {\n    updateActivity(\n      id: $id\n      category: $category\n      date: $date\n      description: $description\n      name: $name\n      project: $project\n      subcategory: $subcategory\n      type: $type\n    ) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteActivity($id: String!) {\n    deleteActivity(id: $id) {\n      success\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteActivity($id: String!) {\n    deleteActivity(id: $id) {\n      success\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ShareActivity(\n    $id: String!\n    $userId: String!\n  ) {\n    shareActivity(\n      id: $id\n      userId: $userId\n    ) {\n      user\n      liability\n      accounts {\n        account\n        amount\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation ShareActivity(\n    $id: String!\n    $userId: String!\n  ) {\n    shareActivity(\n      id: $id\n      userId: $userId\n    ) {\n      user\n      liability\n      accounts {\n        account\n        amount\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AddTransaction(\n    $activityId: String!\n    $id: String!\n    $amount: Float!\n    $fromAccount: String!\n    $toAccount: String!\n  ) {\n    addTransaction(\n      activityId: $activityId\n      id: $id\n      amount: $amount\n      fromAccount: $fromAccount\n      toAccount: $toAccount\n    ) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation AddTransaction(\n    $activityId: String!\n    $id: String!\n    $amount: Float!\n    $fromAccount: String!\n    $toAccount: String!\n  ) {\n    addTransaction(\n      activityId: $activityId\n      id: $id\n      amount: $amount\n      fromAccount: $fromAccount\n      toAccount: $toAccount\n    ) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateTransaction(\n    $activityId: String!\n    $id: String!\n    $amount: Float\n    $fromAccount: String\n    $fromAsset: String\n    $fromCounterparty: String\n    $toAccount: String\n    $toAsset: String\n    $toCounterparty: String\n  ) {\n    updateTransaction(\n      activityId: $activityId\n      id: $id\n      amount: $amount\n      fromAccount: $fromAccount\n      fromAsset: $fromAsset\n      fromCounterparty: $fromCounterparty\n      toAccount: $toAccount\n      toAsset: $toAsset\n      toCounterparty: $toCounterparty\n    ) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateTransaction(\n    $activityId: String!\n    $id: String!\n    $amount: Float\n    $fromAccount: String\n    $fromAsset: String\n    $fromCounterparty: String\n    $toAccount: String\n    $toAsset: String\n    $toCounterparty: String\n  ) {\n    updateTransaction(\n      activityId: $activityId\n      id: $id\n      amount: $amount\n      fromAccount: $fromAccount\n      fromAsset: $fromAsset\n      fromCounterparty: $fromCounterparty\n      toAccount: $toAccount\n      toAsset: $toAsset\n      toCounterparty: $toCounterparty\n    ) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteTransaction($activityId: String!, $id: String!) {\n    deleteTransaction(activityId: $activityId, id: $id) {\n      success\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteTransaction($activityId: String!, $id: String!) {\n    deleteTransaction(activityId: $activityId, id: $id) {\n      success\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateActivityCategory(\n    $id: String!\n    $name: String!\n    $type: String!\n    $emoji: String\n  ) {\n    createActivityCategory(\n      id: $id\n      name: $name\n      type: $type\n      emoji: $emoji\n    ) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateActivityCategory(\n    $id: String!\n    $name: String!\n    $type: String!\n    $emoji: String\n  ) {\n    createActivityCategory(\n      id: $id\n      name: $name\n      type: $type\n      emoji: $emoji\n    ) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateActivityCategory($id: String!, $name: String!, $emoji: String) {\n    updateActivityCategory(id: $id, name: $name, emoji: $emoji) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateActivityCategory($id: String!, $name: String!, $emoji: String) {\n    updateActivityCategory(id: $id, name: $name, emoji: $emoji) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteActivityCategory($id: String!) {\n    deleteActivityCategory(id: $id) {\n      success\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteActivityCategory($id: String!) {\n    deleteActivityCategory(id: $id) {\n      success\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateActivitySubCategory(\n    $id: String!\n    $name: String!\n    $category: String!\n    $emoji: String\n  ) {\n    createActivitySubCategory(\n      id: $id\n      name: $name\n      category: $category\n      emoji: $emoji\n    ) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateActivitySubCategory(\n    $id: String!\n    $name: String!\n    $category: String!\n    $emoji: String\n  ) {\n    createActivitySubCategory(\n      id: $id\n      name: $name\n      category: $category\n      emoji: $emoji\n    ) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateActivitySubCategory($id: String!, $name: String!, $emoji: String) {\n    updateActivitySubCategory(id: $id, name: $name, emoji: $emoji) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateActivitySubCategory($id: String!, $name: String!, $emoji: String) {\n    updateActivitySubCategory(id: $id, name: $name, emoji: $emoji) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteActivitySubCategory($id: String!) {\n    deleteActivitySubCategory(id: $id) {\n      success\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteActivitySubCategory($id: String!) {\n    deleteActivitySubCategory(id: $id) {\n      success\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateAsset(\n    $id: String!\n    $account: String!\n    $name: String!\n    $description: String\n    $location: String\n  ) {\n    createAsset(\n      id: $id\n      account: $account\n      name: $name\n      description: $description\n      location: $location\n    ) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateAsset(\n    $id: String!\n    $account: String!\n    $name: String!\n    $description: String\n    $location: String\n  ) {\n    createAsset(\n      id: $id\n      account: $account\n      name: $name\n      description: $description\n      location: $location\n    ) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateAsset(\n    $id: String!\n    $name: String\n    $description: String\n    $location: String\n  ) {\n    updateAsset(\n      id: $id\n      name: $name\n      description: $description\n      location: $location\n    ) {\n      id\n      name\n      description\n      location\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateAsset(\n    $id: String!\n    $name: String\n    $description: String\n    $location: String\n  ) {\n    updateAsset(\n      id: $id\n      name: $name\n      description: $description\n      location: $location\n    ) {\n      id\n      name\n      description\n      location\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteAsset($id: String!) {\n    deleteAsset(id: $id) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteAsset($id: String!) {\n    deleteAsset(id: $id) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteContact(\n    $id: String!\n  ) {\n    deleteContact(\n      id: $id\n    )\n  }\n"): (typeof documents)["\n  mutation DeleteContact(\n    $id: String!\n  ) {\n    deleteContact(\n      id: $id\n    )\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateCounterparty(\n    $id: String!\n    $account: String!\n    $name: String!\n    $description: String\n    $contact: String\n  ) {\n    createCounterparty(\n      id: $id\n      account: $account\n      name: $name\n      description: $description\n      contact: $contact\n    ) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateCounterparty(\n    $id: String!\n    $account: String!\n    $name: String!\n    $description: String\n    $contact: String\n  ) {\n    createCounterparty(\n      id: $id\n      account: $account\n      name: $name\n      description: $description\n      contact: $contact\n    ) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateCounterparty(\n    $id: String!\n    $name: String\n    $description: String\n    $contact: String\n  ) {\n    updateCounterparty(\n      id: $id\n      name: $name\n      description: $description\n      contact: $contact\n    ) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateCounterparty(\n    $id: String!\n    $name: String\n    $description: String\n    $contact: String\n  ) {\n    updateCounterparty(\n      id: $id\n      name: $name\n      description: $description\n      contact: $contact\n    ) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteCounterparty(\n    $id: String!\n  ) {\n    deleteCounterparty(\n      id: $id\n    )\n  }\n"): (typeof documents)["\n  mutation DeleteCounterparty(\n    $id: String!\n  ) {\n    deleteCounterparty(\n      id: $id\n    )\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateMovement(\n    $id: String!\n    $date: Date!\n    $name: String!\n    $account: String!\n    $amount: Float!\n  ) {\n    createMovement(\n      id: $id\n      date: $date\n      name: $name\n      account: $account\n      amount: $amount\n    ) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateMovement(\n    $id: String!\n    $date: Date!\n    $name: String!\n    $account: String!\n    $amount: Float!\n  ) {\n    createMovement(\n      id: $id\n      date: $date\n      name: $name\n      account: $account\n      amount: $amount\n    ) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateMovement($id: String!, $date: Date, $amount: Float, $name: String, $account: String) {\n    updateMovement(id: $id, date: $date, amount: $amount, name: $name, account: $account) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateMovement($id: String!, $date: Date, $amount: Float, $name: String, $account: String) {\n    updateMovement(id: $id, date: $date, amount: $amount, name: $name, account: $account) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteMovement($id: String!) {\n      deleteMovement(id: $id) {\n      success\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteMovement($id: String!) {\n      deleteMovement(id: $id) {\n      success\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateMovementActivity(\n    $id: String!\n    $movementId: String!\n    $activityId: String!\n    $amount: Float!\n  ) {\n    createMovementActivity(\n      id: $id\n      movementId: $movementId\n      activityId: $activityId\n      amount: $amount\n    ) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateMovementActivity(\n    $id: String!\n    $movementId: String!\n    $activityId: String!\n    $amount: Float!\n  ) {\n    createMovementActivity(\n      id: $id\n      movementId: $movementId\n      activityId: $activityId\n      amount: $amount\n    ) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateMovementActivity($id: String!, $amount: Float!) {\n    updateMovementActivity(id: $id, amount: $amount) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateMovementActivity($id: String!, $amount: Float!) {\n    updateMovementActivity(id: $id, amount: $amount) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteMovementActivity($id: String!) {\n    deleteMovementActivity(id: $id) {\n      success\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteMovementActivity($id: String!) {\n    deleteMovementActivity(id: $id) {\n      success\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateProject(\n    $id: String!\n    $name: String!\n    $emoji: String\n  ) {\n    createProject(id: $id, name: $name, emoji: $emoji) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateProject(\n    $id: String!\n    $name: String!\n    $emoji: String\n  ) {\n    createProject(id: $id, name: $name, emoji: $emoji) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateProject(\n    $id: String!\n    $name: String\n    $emoji: String\n    $startDate: Date\n    $endDate: Date\n  ) {\n    updateProject(\n      id: $id\n      name: $name\n      emoji: $emoji\n      startDate: $startDate\n      endDate: $endDate\n    ) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateProject(\n    $id: String!\n    $name: String\n    $emoji: String\n    $startDate: Date\n    $endDate: Date\n  ) {\n    updateProject(\n      id: $id\n      name: $name\n      emoji: $emoji\n      startDate: $startDate\n      endDate: $endDate\n    ) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteProject($id: String!) {\n    deleteProject(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteProject($id: String!) {\n    deleteProject(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MissingEvents(\n      $lastSync: Float!,\n  ) {\n    events(lastSync: $lastSync) {\n      type\n      payload\n      createdAt\n      clientId\n    }\n  }\n"): (typeof documents)["\n  query MissingEvents(\n      $lastSync: Float!,\n  ) {\n    events(lastSync: $lastSync) {\n      type\n      payload\n      createdAt\n      clientId\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;