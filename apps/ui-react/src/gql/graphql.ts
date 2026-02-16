/* eslint-disable */
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date string, such as 2007-12-03, compliant with the `full-date` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  Date: { input: string; output: string; }
};

export type Account = {
  default: Scalars['Boolean']['output'];
  id: Scalars['String']['output'];
  movements: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  startingBalance: Maybe<Scalars['Float']['output']>;
  startingCashBalance: Maybe<Scalars['Float']['output']>;
  type: Scalars['String']['output'];
  user: Maybe<Scalars['String']['output']>;
};

export type Activity = {
  amount: Scalars['Float']['output'];
  category: Maybe<Scalars['String']['output']>;
  date: Scalars['Date']['output'];
  description: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  movements: Array<ActivityMovement>;
  name: Scalars['String']['output'];
  number: Scalars['Int']['output'];
  project: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
  subcategory: Maybe<Scalars['String']['output']>;
  transactions: Array<Transaction>;
  type: Scalars['String']['output'];
  user: Scalars['String']['output'];
};

export type ActivityCategory = {
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type ActivityMovement = {
  amount: Scalars['Float']['output'];
  id: Scalars['String']['output'];
  movement: Scalars['String']['output'];
};

export type ActivityMovementInput = {
  amount: Scalars['Float']['input'];
  id: Scalars['String']['input'];
  movement: Scalars['String']['input'];
};

export type ActivitySubCategory = {
  category: Scalars['String']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type DeleteAccountResponse = {
  id: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type DeleteActivityResponse = {
  id: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type DeleteMovementActivityResponse = {
  id: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type DeleteMovementResponse = {
  id: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type DeleteTransactionResponse = {
  id: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type Event = {
  clientId: Scalars['String']['output'];
  createdAt: Scalars['Float']['output'];
  payload: Scalars['String']['output'];
  type: Scalars['String']['output'];
  user: Scalars['String']['output'];
  workspace: Scalars['String']['output'];
};

export type Movement = {
  account: Scalars['String']['output'];
  activities: Array<MovementActivity>;
  amount: Scalars['Float']['output'];
  date: Scalars['Date']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  status: Scalars['String']['output'];
};

export type MovementActivity = {
  activity: Scalars['String']['output'];
  amount: Scalars['Float']['output'];
  id: Scalars['String']['output'];
};

export type Mutation = {
  addTransaction: Transaction;
  createAccount: Account;
  createActivity: Activity;
  createActivityCategory: ActivityCategory;
  createActivitySubCategory: ActivitySubCategory;
  createMovement: Movement;
  createMovementActivity: MovementActivity;
  createProject: Project;
  createWorkspace: Workspace;
  deleteAccount: DeleteAccountResponse;
  deleteActivity: DeleteActivityResponse;
  deleteActivityCategory: DeleteActivityResponse;
  deleteActivitySubCategory: DeleteActivityResponse;
  deleteMovement: DeleteMovementResponse;
  deleteMovementActivity: DeleteMovementActivityResponse;
  deleteProject: Scalars['Boolean']['output'];
  deleteTransaction: DeleteTransactionResponse;
  deleteWorkspace: Scalars['Boolean']['output'];
  updateAccount: Account;
  updateActivity: Activity;
  updateActivityCategory: ActivityCategory;
  updateActivitySubCategory: ActivitySubCategory;
  updateMovement: Movement;
  updateMovementActivity: MovementActivity;
  updateProject: Project;
  updateTransaction: Transaction;
};


export type MutationAddTransactionArgs = {
  activityId: Scalars['String']['input'];
  amount: Scalars['Float']['input'];
  fromAccount: Scalars['String']['input'];
  fromUser?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  toAccount: Scalars['String']['input'];
  toUser?: InputMaybe<Scalars['String']['input']>;
};


export type MutationCreateAccountArgs = {
  id: Scalars['String']['input'];
  name: Scalars['String']['input'];
  type: Scalars['String']['input'];
  workspace: Scalars['String']['input'];
};


export type MutationCreateActivityArgs = {
  category?: InputMaybe<Scalars['String']['input']>;
  date: Scalars['Date']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  movement?: InputMaybe<ActivityMovementInput>;
  name: Scalars['String']['input'];
  project?: InputMaybe<Scalars['String']['input']>;
  subcategory?: InputMaybe<Scalars['String']['input']>;
  transactions?: InputMaybe<Array<TransactionInput>>;
  type: Scalars['String']['input'];
  workspace: Scalars['String']['input'];
};


export type MutationCreateActivityCategoryArgs = {
  id: Scalars['String']['input'];
  name: Scalars['String']['input'];
  type: Scalars['String']['input'];
  workspace: Scalars['String']['input'];
};


export type MutationCreateActivitySubCategoryArgs = {
  category: Scalars['String']['input'];
  id: Scalars['String']['input'];
  name: Scalars['String']['input'];
  workspace: Scalars['String']['input'];
};


export type MutationCreateMovementArgs = {
  account: Scalars['String']['input'];
  amount: Scalars['Float']['input'];
  date: Scalars['Date']['input'];
  id: Scalars['String']['input'];
  name: Scalars['String']['input'];
  workspace: Scalars['String']['input'];
};


export type MutationCreateMovementActivityArgs = {
  activityId: Scalars['String']['input'];
  amount: Scalars['Float']['input'];
  id: Scalars['String']['input'];
  movementId: Scalars['String']['input'];
  workspace: Scalars['String']['input'];
};


export type MutationCreateProjectArgs = {
  emoji?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  name: Scalars['String']['input'];
  workspace: Scalars['String']['input'];
};


export type MutationCreateWorkspaceArgs = {
  currency: Scalars['String']['input'];
  name: Scalars['String']['input'];
  startingDate: Scalars['Date']['input'];
};


export type MutationDeleteAccountArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteActivityArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteActivityCategoryArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteActivitySubCategoryArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteMovementArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteMovementActivityArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteProjectArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteTransactionArgs = {
  activityId: Scalars['String']['input'];
  id: Scalars['String']['input'];
};


export type MutationDeleteWorkspaceArgs = {
  id: Scalars['String']['input'];
};


export type MutationUpdateAccountArgs = {
  id: Scalars['String']['input'];
  movements?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  startingBalance?: InputMaybe<Scalars['Float']['input']>;
  startingCashBalance?: InputMaybe<Scalars['Float']['input']>;
};


export type MutationUpdateActivityArgs = {
  category?: InputMaybe<Scalars['String']['input']>;
  date?: InputMaybe<Scalars['Date']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  project?: InputMaybe<Scalars['String']['input']>;
  subcategory?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateActivityCategoryArgs = {
  id: Scalars['String']['input'];
  name: Scalars['String']['input'];
};


export type MutationUpdateActivitySubCategoryArgs = {
  id: Scalars['String']['input'];
  name: Scalars['String']['input'];
};


export type MutationUpdateMovementArgs = {
  account?: InputMaybe<Scalars['String']['input']>;
  amount?: InputMaybe<Scalars['Float']['input']>;
  date?: InputMaybe<Scalars['Date']['input']>;
  id: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateMovementActivityArgs = {
  amount: Scalars['Float']['input'];
  id: Scalars['String']['input'];
};


export type MutationUpdateProjectArgs = {
  emoji?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['Date']['input']>;
  id: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['Date']['input']>;
};


export type MutationUpdateTransactionArgs = {
  activityId: Scalars['String']['input'];
  amount?: InputMaybe<Scalars['Float']['input']>;
  fromAccount?: InputMaybe<Scalars['String']['input']>;
  fromUser?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  toAccount?: InputMaybe<Scalars['String']['input']>;
  toUser?: InputMaybe<Scalars['String']['input']>;
};

export type Project = {
  emoji: Maybe<Scalars['String']['output']>;
  endDate: Maybe<Scalars['Date']['output']>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  startDate: Maybe<Scalars['Date']['output']>;
};

export type Query = {
  accounts: Array<Account>;
  activities: Array<Activity>;
  activityCategories: Array<ActivityCategory>;
  activitySubcategories: Array<ActivitySubCategory>;
  events: Array<Event>;
  movements: Array<Movement>;
  projects: Array<Project>;
  workspace: Workspace;
  workspaces: Array<Workspace>;
};


export type QueryAccountsArgs = {
  workspaceId: Scalars['String']['input'];
};


export type QueryActivitiesArgs = {
  workspaceId: Scalars['String']['input'];
};


export type QueryActivityCategoriesArgs = {
  workspaceId: Scalars['String']['input'];
};


export type QueryActivitySubcategoriesArgs = {
  workspaceId: Scalars['String']['input'];
};


export type QueryEventsArgs = {
  lastSync: Scalars['Float']['input'];
  workspace: Scalars['String']['input'];
};


export type QueryMovementsArgs = {
  workspaceId: Scalars['String']['input'];
};


export type QueryProjectsArgs = {
  workspaceId: Scalars['String']['input'];
};


export type QueryWorkspaceArgs = {
  id: Scalars['String']['input'];
};

export type Subscription = {
  /** Events related to posts */
  events: Event;
};

export type Transaction = {
  amount: Scalars['Float']['output'];
  fromAccount: Scalars['String']['output'];
  fromUser: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  toAccount: Scalars['String']['output'];
  toUser: Maybe<Scalars['String']['output']>;
};

export type TransactionInput = {
  amount: Scalars['Float']['input'];
  fromAccount: Scalars['String']['input'];
  fromUser?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  toAccount: Scalars['String']['input'];
  toUser?: InputMaybe<Scalars['String']['input']>;
};

export type User = {
  email: Scalars['String']['output'];
  id: Scalars['String']['output'];
  image: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
};

export type Workspace = {
  createdAt: Scalars['String']['output'];
  currency: Scalars['String']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  startingDate: Scalars['Date']['output'];
  users: Array<User>;
};

export type WorkspaceDataQueryVariables = Exact<{
  workspace: Scalars['String']['input'];
}>;


export type WorkspaceDataQuery = { workspace: { id: string, name: string, startingDate: string, currency: string, createdAt: string, users: Array<{ id: string, name: string, email: string, image: string | null }> }, activities: Array<{ id: string, user: string, number: number, name: string, description: string | null, date: string, type: string, category: string | null, subcategory: string | null, project: string | null, amount: number, status: string, transactions: Array<{ id: string, amount: number, fromAccount: string, fromUser: string | null, toAccount: string, toUser: string | null }>, movements: Array<{ id: string, movement: string, amount: number }> }>, activityCategories: Array<{ id: string, name: string, type: string }>, activitySubcategories: Array<{ id: string, name: string, category: string }>, accounts: Array<{ id: string, name: string, type: string, default: boolean, startingBalance: number | null, startingCashBalance: number | null, movements: boolean, user: string | null }>, movements: Array<{ id: string, date: string, amount: number, account: string, name: string, status: string, activities: Array<{ id: string, activity: string, amount: number }> }>, projects: Array<{ id: string, name: string, emoji: string | null, startDate: string | null, endDate: string | null }> };

export type CreateAccountMutationVariables = Exact<{
  id: Scalars['String']['input'];
  name: Scalars['String']['input'];
  type: Scalars['String']['input'];
  workspace: Scalars['String']['input'];
}>;


export type CreateAccountMutation = { createAccount: { id: string } };

export type UpdateAccountMutationVariables = Exact<{
  id: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  startingBalance?: InputMaybe<Scalars['Float']['input']>;
  startingCashBalance?: InputMaybe<Scalars['Float']['input']>;
  movements?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type UpdateAccountMutation = { updateAccount: { id: string } };

export type DeleteAccountMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteAccountMutation = { deleteAccount: { success: boolean } };

export type CreateActivityMutationVariables = Exact<{
  workspace: Scalars['String']['input'];
  category?: InputMaybe<Scalars['String']['input']>;
  date: Scalars['Date']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  movement?: InputMaybe<ActivityMovementInput>;
  name: Scalars['String']['input'];
  project?: InputMaybe<Scalars['String']['input']>;
  subcategory?: InputMaybe<Scalars['String']['input']>;
  transactions?: InputMaybe<Array<TransactionInput> | TransactionInput>;
  type: Scalars['String']['input'];
}>;


export type CreateActivityMutation = { createActivity: { id: string, user: string, number: number } };

export type UpdateActivityMutationVariables = Exact<{
  id: Scalars['String']['input'];
  category?: InputMaybe<Scalars['String']['input']>;
  date?: InputMaybe<Scalars['Date']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  project?: InputMaybe<Scalars['String']['input']>;
  subcategory?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpdateActivityMutation = { updateActivity: { id: string } };

export type DeleteActivityMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteActivityMutation = { deleteActivity: { success: boolean } };

export type AddTransactionMutationVariables = Exact<{
  activityId: Scalars['String']['input'];
  id: Scalars['String']['input'];
  amount: Scalars['Float']['input'];
  fromAccount: Scalars['String']['input'];
  toAccount: Scalars['String']['input'];
}>;


export type AddTransactionMutation = { addTransaction: { id: string } };

export type UpdateTransactionMutationVariables = Exact<{
  activityId: Scalars['String']['input'];
  id: Scalars['String']['input'];
  amount?: InputMaybe<Scalars['Float']['input']>;
  fromAccount?: InputMaybe<Scalars['String']['input']>;
  fromUser?: InputMaybe<Scalars['String']['input']>;
  toAccount?: InputMaybe<Scalars['String']['input']>;
  toUser?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpdateTransactionMutation = { updateTransaction: { id: string } };

export type DeleteTransactionMutationVariables = Exact<{
  activityId: Scalars['String']['input'];
  id: Scalars['String']['input'];
}>;


export type DeleteTransactionMutation = { deleteTransaction: { success: boolean } };

export type CreateActivityCategoryMutationVariables = Exact<{
  id: Scalars['String']['input'];
  name: Scalars['String']['input'];
  type: Scalars['String']['input'];
  workspace: Scalars['String']['input'];
}>;


export type CreateActivityCategoryMutation = { createActivityCategory: { id: string } };

export type UpdateActivityCategoryMutationVariables = Exact<{
  id: Scalars['String']['input'];
  name: Scalars['String']['input'];
}>;


export type UpdateActivityCategoryMutation = { updateActivityCategory: { id: string } };

export type DeleteActivityCategoryMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteActivityCategoryMutation = { deleteActivityCategory: { success: boolean } };

export type CreateActivitySubCategoryMutationVariables = Exact<{
  id: Scalars['String']['input'];
  name: Scalars['String']['input'];
  category: Scalars['String']['input'];
  workspace: Scalars['String']['input'];
}>;


export type CreateActivitySubCategoryMutation = { createActivitySubCategory: { id: string } };

export type UpdateActivitySubCategoryMutationVariables = Exact<{
  id: Scalars['String']['input'];
  name: Scalars['String']['input'];
}>;


export type UpdateActivitySubCategoryMutation = { updateActivitySubCategory: { id: string } };

export type DeleteActivitySubCategoryMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteActivitySubCategoryMutation = { deleteActivitySubCategory: { success: boolean } };

export type CreateMovementMutationVariables = Exact<{
  workspace: Scalars['String']['input'];
  id: Scalars['String']['input'];
  date: Scalars['Date']['input'];
  name: Scalars['String']['input'];
  account: Scalars['String']['input'];
  amount: Scalars['Float']['input'];
}>;


export type CreateMovementMutation = { createMovement: { id: string } };

export type UpdateMovementMutationVariables = Exact<{
  id: Scalars['String']['input'];
  date?: InputMaybe<Scalars['Date']['input']>;
  amount?: InputMaybe<Scalars['Float']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  account?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpdateMovementMutation = { updateMovement: { id: string } };

export type DeleteMovementMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteMovementMutation = { deleteMovement: { success: boolean } };

export type CreateMovementActivityMutationVariables = Exact<{
  workspace: Scalars['String']['input'];
  id: Scalars['String']['input'];
  movementId: Scalars['String']['input'];
  activityId: Scalars['String']['input'];
  amount: Scalars['Float']['input'];
}>;


export type CreateMovementActivityMutation = { createMovementActivity: { id: string } };

export type UpdateMovementActivityMutationVariables = Exact<{
  id: Scalars['String']['input'];
  amount: Scalars['Float']['input'];
}>;


export type UpdateMovementActivityMutation = { updateMovementActivity: { id: string } };

export type DeleteMovementActivityMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteMovementActivityMutation = { deleteMovementActivity: { success: boolean } };

export type CreateProjectMutationVariables = Exact<{
  id: Scalars['String']['input'];
  name: Scalars['String']['input'];
  emoji?: InputMaybe<Scalars['String']['input']>;
  workspace: Scalars['String']['input'];
}>;


export type CreateProjectMutation = { createProject: { id: string } };

export type UpdateProjectMutationVariables = Exact<{
  id: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  emoji?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['Date']['input']>;
  endDate?: InputMaybe<Scalars['Date']['input']>;
}>;


export type UpdateProjectMutation = { updateProject: { id: string } };

export type DeleteProjectMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteProjectMutation = { deleteProject: boolean };

export type CreateWorkspaceMutationVariables = Exact<{
  name: Scalars['String']['input'];
  currency: Scalars['String']['input'];
  startingDate: Scalars['Date']['input'];
}>;


export type CreateWorkspaceMutation = { createWorkspace: { id: string, name: string, currency: string, startingDate: string, createdAt: string, users: Array<{ id: string, email: string, name: string, image: string | null }> } };

export type MissingEventsQueryVariables = Exact<{
  lastSync: Scalars['Float']['input'];
  workspace: Scalars['String']['input'];
}>;


export type MissingEventsQuery = { events: Array<{ type: string, payload: string, createdAt: number, clientId: string }> };

export type WorkspacesQueryVariables = Exact<{ [key: string]: never; }>;


export type WorkspacesQuery = { workspaces: Array<{ id: string, name: string }> };


export const WorkspaceDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WorkspaceData"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspace"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspace"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"startingDate"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"image"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"activities"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"workspaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspace"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"}},{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"subcategory"}},{"kind":"Field","name":{"kind":"Name","value":"project"}},{"kind":"Field","name":{"kind":"Name","value":"transactions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"fromAccount"}},{"kind":"Field","name":{"kind":"Name","value":"fromUser"}},{"kind":"Field","name":{"kind":"Name","value":"toAccount"}},{"kind":"Field","name":{"kind":"Name","value":"toUser"}}]}},{"kind":"Field","name":{"kind":"Name","value":"movements"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"movement"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"activityCategories"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"workspaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspace"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"Field","name":{"kind":"Name","value":"activitySubcategories"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"workspaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspace"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"category"}}]}},{"kind":"Field","name":{"kind":"Name","value":"accounts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"workspaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspace"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"default"}},{"kind":"Field","name":{"kind":"Name","value":"startingBalance"}},{"kind":"Field","name":{"kind":"Name","value":"startingCashBalance"}},{"kind":"Field","name":{"kind":"Name","value":"movements"}},{"kind":"Field","name":{"kind":"Name","value":"user"}}]}},{"kind":"Field","name":{"kind":"Name","value":"movements"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"workspaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspace"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"account"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"activities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"activity"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"projects"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"workspaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspace"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"emoji"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}}]}}]}}]} as unknown as DocumentNode<WorkspaceDataQuery, WorkspaceDataQueryVariables>;
export const CreateAccountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateAccount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"type"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspace"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createAccount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"type"}}},{"kind":"Argument","name":{"kind":"Name","value":"workspace"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspace"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateAccountMutation, CreateAccountMutationVariables>;
export const UpdateAccountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAccount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startingBalance"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startingCashBalance"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"movements"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAccount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"startingBalance"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startingBalance"}}},{"kind":"Argument","name":{"kind":"Name","value":"startingCashBalance"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startingCashBalance"}}},{"kind":"Argument","name":{"kind":"Name","value":"movements"},"value":{"kind":"Variable","name":{"kind":"Name","value":"movements"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateAccountMutation, UpdateAccountMutationVariables>;
export const DeleteAccountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteAccount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteAccount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode<DeleteAccountMutation, DeleteAccountMutationVariables>;
export const CreateActivityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateActivity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspace"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"category"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"date"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Date"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"description"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"movement"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ActivityMovementInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"project"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"subcategory"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"transactions"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TransactionInput"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"type"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createActivity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"workspace"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspace"}}},{"kind":"Argument","name":{"kind":"Name","value":"category"},"value":{"kind":"Variable","name":{"kind":"Name","value":"category"}}},{"kind":"Argument","name":{"kind":"Name","value":"date"},"value":{"kind":"Variable","name":{"kind":"Name","value":"date"}}},{"kind":"Argument","name":{"kind":"Name","value":"description"},"value":{"kind":"Variable","name":{"kind":"Name","value":"description"}}},{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"movement"},"value":{"kind":"Variable","name":{"kind":"Name","value":"movement"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"project"},"value":{"kind":"Variable","name":{"kind":"Name","value":"project"}}},{"kind":"Argument","name":{"kind":"Name","value":"subcategory"},"value":{"kind":"Variable","name":{"kind":"Name","value":"subcategory"}}},{"kind":"Argument","name":{"kind":"Name","value":"transactions"},"value":{"kind":"Variable","name":{"kind":"Name","value":"transactions"}}},{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"type"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"}},{"kind":"Field","name":{"kind":"Name","value":"number"}}]}}]}}]} as unknown as DocumentNode<CreateActivityMutation, CreateActivityMutationVariables>;
export const UpdateActivityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateActivity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"category"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"date"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Date"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"description"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"project"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"subcategory"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"type"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateActivity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"category"},"value":{"kind":"Variable","name":{"kind":"Name","value":"category"}}},{"kind":"Argument","name":{"kind":"Name","value":"date"},"value":{"kind":"Variable","name":{"kind":"Name","value":"date"}}},{"kind":"Argument","name":{"kind":"Name","value":"description"},"value":{"kind":"Variable","name":{"kind":"Name","value":"description"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"project"},"value":{"kind":"Variable","name":{"kind":"Name","value":"project"}}},{"kind":"Argument","name":{"kind":"Name","value":"subcategory"},"value":{"kind":"Variable","name":{"kind":"Name","value":"subcategory"}}},{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"type"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateActivityMutation, UpdateActivityMutationVariables>;
export const DeleteActivityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteActivity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteActivity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode<DeleteActivityMutation, DeleteActivityMutationVariables>;
export const AddTransactionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddTransaction"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"activityId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"amount"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fromAccount"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"toAccount"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addTransaction"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"activityId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"activityId"}}},{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"amount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"amount"}}},{"kind":"Argument","name":{"kind":"Name","value":"fromAccount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fromAccount"}}},{"kind":"Argument","name":{"kind":"Name","value":"toAccount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"toAccount"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<AddTransactionMutation, AddTransactionMutationVariables>;
export const UpdateTransactionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateTransaction"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"activityId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"amount"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fromAccount"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fromUser"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"toAccount"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"toUser"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTransaction"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"activityId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"activityId"}}},{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"amount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"amount"}}},{"kind":"Argument","name":{"kind":"Name","value":"fromAccount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fromAccount"}}},{"kind":"Argument","name":{"kind":"Name","value":"fromUser"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fromUser"}}},{"kind":"Argument","name":{"kind":"Name","value":"toAccount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"toAccount"}}},{"kind":"Argument","name":{"kind":"Name","value":"toUser"},"value":{"kind":"Variable","name":{"kind":"Name","value":"toUser"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateTransactionMutation, UpdateTransactionMutationVariables>;
export const DeleteTransactionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteTransaction"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"activityId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteTransaction"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"activityId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"activityId"}}},{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode<DeleteTransactionMutation, DeleteTransactionMutationVariables>;
export const CreateActivityCategoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateActivityCategory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"type"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspace"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createActivityCategory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"type"}}},{"kind":"Argument","name":{"kind":"Name","value":"workspace"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspace"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateActivityCategoryMutation, CreateActivityCategoryMutationVariables>;
export const UpdateActivityCategoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateActivityCategory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateActivityCategory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateActivityCategoryMutation, UpdateActivityCategoryMutationVariables>;
export const DeleteActivityCategoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteActivityCategory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteActivityCategory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode<DeleteActivityCategoryMutation, DeleteActivityCategoryMutationVariables>;
export const CreateActivitySubCategoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateActivitySubCategory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"category"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspace"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createActivitySubCategory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"category"},"value":{"kind":"Variable","name":{"kind":"Name","value":"category"}}},{"kind":"Argument","name":{"kind":"Name","value":"workspace"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspace"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateActivitySubCategoryMutation, CreateActivitySubCategoryMutationVariables>;
export const UpdateActivitySubCategoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateActivitySubCategory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateActivitySubCategory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateActivitySubCategoryMutation, UpdateActivitySubCategoryMutationVariables>;
export const DeleteActivitySubCategoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteActivitySubCategory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteActivitySubCategory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode<DeleteActivitySubCategoryMutation, DeleteActivitySubCategoryMutationVariables>;
export const CreateMovementDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateMovement"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspace"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"date"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Date"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"account"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"amount"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createMovement"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"workspace"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspace"}}},{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"date"},"value":{"kind":"Variable","name":{"kind":"Name","value":"date"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"account"},"value":{"kind":"Variable","name":{"kind":"Name","value":"account"}}},{"kind":"Argument","name":{"kind":"Name","value":"amount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"amount"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateMovementMutation, CreateMovementMutationVariables>;
export const UpdateMovementDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateMovement"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"date"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Date"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"amount"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"account"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateMovement"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"date"},"value":{"kind":"Variable","name":{"kind":"Name","value":"date"}}},{"kind":"Argument","name":{"kind":"Name","value":"amount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"amount"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"account"},"value":{"kind":"Variable","name":{"kind":"Name","value":"account"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateMovementMutation, UpdateMovementMutationVariables>;
export const DeleteMovementDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteMovement"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteMovement"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode<DeleteMovementMutation, DeleteMovementMutationVariables>;
export const CreateMovementActivityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateMovementActivity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspace"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"movementId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"activityId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"amount"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createMovementActivity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"workspace"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspace"}}},{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"movementId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"movementId"}}},{"kind":"Argument","name":{"kind":"Name","value":"activityId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"activityId"}}},{"kind":"Argument","name":{"kind":"Name","value":"amount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"amount"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateMovementActivityMutation, CreateMovementActivityMutationVariables>;
export const UpdateMovementActivityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateMovementActivity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"amount"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateMovementActivity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"amount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"amount"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateMovementActivityMutation, UpdateMovementActivityMutationVariables>;
export const DeleteMovementActivityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteMovementActivity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteMovementActivity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode<DeleteMovementActivityMutation, DeleteMovementActivityMutationVariables>;
export const CreateProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"emoji"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspace"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createProject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"emoji"},"value":{"kind":"Variable","name":{"kind":"Name","value":"emoji"}}},{"kind":"Argument","name":{"kind":"Name","value":"workspace"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspace"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateProjectMutation, CreateProjectMutationVariables>;
export const UpdateProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"emoji"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Date"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Date"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateProject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"emoji"},"value":{"kind":"Variable","name":{"kind":"Name","value":"emoji"}}},{"kind":"Argument","name":{"kind":"Name","value":"startDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"endDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateProjectMutation, UpdateProjectMutationVariables>;
export const DeleteProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteProject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteProjectMutation, DeleteProjectMutationVariables>;
export const CreateWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateWorkspace"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"currency"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startingDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Date"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createWorkspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"currency"},"value":{"kind":"Variable","name":{"kind":"Name","value":"currency"}}},{"kind":"Argument","name":{"kind":"Name","value":"startingDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startingDate"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"startingDate"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"image"}}]}}]}}]}}]} as unknown as DocumentNode<CreateWorkspaceMutation, CreateWorkspaceMutationVariables>;
export const MissingEventsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MissingEvents"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"lastSync"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspace"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"events"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"lastSync"},"value":{"kind":"Variable","name":{"kind":"Name","value":"lastSync"}}},{"kind":"Argument","name":{"kind":"Name","value":"workspace"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspace"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"clientId"}}]}}]}}]} as unknown as DocumentNode<MissingEventsQuery, MissingEventsQueryVariables>;
export const WorkspacesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Workspaces"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaces"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<WorkspacesQuery, WorkspacesQueryVariables>;