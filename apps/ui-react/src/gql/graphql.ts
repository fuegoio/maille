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
  /** A field whose value is a generic Universally Unique Identifier: https://en.wikipedia.org/wiki/Universally_unique_identifier. */
  UUID: { input: string; output: string; }
};

export type Account = {
  default: Scalars['Boolean']['output'];
  id: Scalars['UUID']['output'];
  movements: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  startingBalance: Maybe<Scalars['Float']['output']>;
  startingCashBalance: Maybe<Scalars['Float']['output']>;
  type: Scalars['String']['output'];
  user: Maybe<Scalars['UUID']['output']>;
  workspace: Maybe<Scalars['UUID']['output']>;
};

export type Activity = {
  amount: Scalars['Float']['output'];
  category: Maybe<Scalars['UUID']['output']>;
  date: Scalars['Date']['output'];
  description: Maybe<Scalars['String']['output']>;
  id: Scalars['UUID']['output'];
  movements: Array<ActivityMovement>;
  name: Scalars['String']['output'];
  number: Scalars['Int']['output'];
  project: Maybe<Scalars['UUID']['output']>;
  status: Scalars['String']['output'];
  subcategory: Maybe<Scalars['UUID']['output']>;
  transactions: Array<Transaction>;
  type: Scalars['String']['output'];
  workspace: Maybe<Scalars['UUID']['output']>;
};

export type ActivityCategory = {
  id: Scalars['UUID']['output'];
  name: Scalars['String']['output'];
  type: Scalars['String']['output'];
  workspace: Maybe<Scalars['UUID']['output']>;
};

export type ActivityMovement = {
  amount: Scalars['Float']['output'];
  id: Scalars['UUID']['output'];
  movement: Scalars['UUID']['output'];
  workspace: Maybe<Scalars['UUID']['output']>;
};

export type ActivityMovementInput = {
  amount: Scalars['Float']['input'];
  id: Scalars['UUID']['input'];
  movement: Scalars['UUID']['input'];
};

export type ActivitySubCategory = {
  category: Scalars['UUID']['output'];
  id: Scalars['UUID']['output'];
  name: Scalars['String']['output'];
  workspace: Maybe<Scalars['UUID']['output']>;
};

export type CreateUser = {
  accounts: Array<Account>;
  avatar: Maybe<Scalars['String']['output']>;
  email: Scalars['String']['output'];
  firstName: Scalars['String']['output'];
  id: Scalars['UUID']['output'];
  lastName: Scalars['String']['output'];
};


export type CreateUserAccountsArgs = {
  workspaceId?: InputMaybe<Scalars['UUID']['input']>;
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
  clientId: Scalars['UUID']['output'];
  createdAt: Scalars['Float']['output'];
  payload: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type Movement = {
  account: Scalars['UUID']['output'];
  activities: Array<MovementActivity>;
  amount: Scalars['Float']['output'];
  date: Scalars['Date']['output'];
  id: Scalars['UUID']['output'];
  name: Scalars['String']['output'];
  status: Scalars['String']['output'];
  workspace: Maybe<Scalars['UUID']['output']>;
};

export type MovementActivity = {
  activity: Scalars['UUID']['output'];
  amount: Scalars['Float']['output'];
  id: Scalars['UUID']['output'];
  workspace: Maybe<Scalars['UUID']['output']>;
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
  createUser: CreateUser;
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
  updateUser: User;
};


export type MutationAddTransactionArgs = {
  activityId: Scalars['UUID']['input'];
  amount: Scalars['Float']['input'];
  fromAccount?: InputMaybe<Scalars['UUID']['input']>;
  fromUser?: InputMaybe<Scalars['UUID']['input']>;
  id: Scalars['UUID']['input'];
  toAccount?: InputMaybe<Scalars['UUID']['input']>;
  toUser?: InputMaybe<Scalars['UUID']['input']>;
};


export type MutationCreateAccountArgs = {
  id: Scalars['UUID']['input'];
  name: Scalars['String']['input'];
  type: Scalars['String']['input'];
  workspace?: InputMaybe<Scalars['UUID']['input']>;
};


export type MutationCreateActivityArgs = {
  category?: InputMaybe<Scalars['UUID']['input']>;
  date: Scalars['Date']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
  movement?: InputMaybe<ActivityMovementInput>;
  name: Scalars['String']['input'];
  project?: InputMaybe<Scalars['UUID']['input']>;
  subcategory?: InputMaybe<Scalars['UUID']['input']>;
  transactions?: InputMaybe<Array<TransactionInput>>;
  type: Scalars['String']['input'];
  workspace?: InputMaybe<Scalars['UUID']['input']>;
};


export type MutationCreateActivityCategoryArgs = {
  id: Scalars['UUID']['input'];
  name: Scalars['String']['input'];
  type: Scalars['String']['input'];
  workspace?: InputMaybe<Scalars['UUID']['input']>;
};


export type MutationCreateActivitySubCategoryArgs = {
  category: Scalars['UUID']['input'];
  id: Scalars['UUID']['input'];
  name: Scalars['String']['input'];
  workspace?: InputMaybe<Scalars['UUID']['input']>;
};


export type MutationCreateMovementArgs = {
  account: Scalars['UUID']['input'];
  amount: Scalars['Float']['input'];
  date: Scalars['Date']['input'];
  id: Scalars['UUID']['input'];
  name: Scalars['String']['input'];
  workspace?: InputMaybe<Scalars['UUID']['input']>;
};


export type MutationCreateMovementActivityArgs = {
  activityId: Scalars['UUID']['input'];
  amount: Scalars['Float']['input'];
  id: Scalars['UUID']['input'];
  movementId: Scalars['UUID']['input'];
  workspace?: InputMaybe<Scalars['UUID']['input']>;
};


export type MutationCreateProjectArgs = {
  emoji?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
  name: Scalars['String']['input'];
  workspace?: InputMaybe<Scalars['UUID']['input']>;
};


export type MutationCreateUserArgs = {
  email: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  lastName: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationCreateWorkspaceArgs = {
  currency: Scalars['String']['input'];
  id?: InputMaybe<Scalars['UUID']['input']>;
  name: Scalars['String']['input'];
  startingDate?: InputMaybe<Scalars['String']['input']>;
};


export type MutationDeleteAccountArgs = {
  id: Scalars['UUID']['input'];
};


export type MutationDeleteActivityArgs = {
  id: Scalars['UUID']['input'];
};


export type MutationDeleteActivityCategoryArgs = {
  id: Scalars['UUID']['input'];
};


export type MutationDeleteActivitySubCategoryArgs = {
  id: Scalars['UUID']['input'];
};


export type MutationDeleteMovementArgs = {
  id: Scalars['UUID']['input'];
};


export type MutationDeleteMovementActivityArgs = {
  id: Scalars['UUID']['input'];
};


export type MutationDeleteProjectArgs = {
  id: Scalars['UUID']['input'];
};


export type MutationDeleteTransactionArgs = {
  activityId: Scalars['UUID']['input'];
  id: Scalars['UUID']['input'];
};


export type MutationDeleteWorkspaceArgs = {
  id: Scalars['UUID']['input'];
};


export type MutationUpdateAccountArgs = {
  id: Scalars['UUID']['input'];
  movements?: InputMaybe<Scalars['Boolean']['input']>;
  startingBalance?: InputMaybe<Scalars['Float']['input']>;
  startingCashBalance?: InputMaybe<Scalars['Float']['input']>;
};


export type MutationUpdateActivityArgs = {
  category?: InputMaybe<Scalars['UUID']['input']>;
  date?: InputMaybe<Scalars['Date']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  project?: InputMaybe<Scalars['UUID']['input']>;
  subcategory?: InputMaybe<Scalars['UUID']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateActivityCategoryArgs = {
  id: Scalars['UUID']['input'];
  name: Scalars['String']['input'];
};


export type MutationUpdateActivitySubCategoryArgs = {
  id: Scalars['UUID']['input'];
  name: Scalars['String']['input'];
};


export type MutationUpdateMovementArgs = {
  amount?: InputMaybe<Scalars['Float']['input']>;
  date?: InputMaybe<Scalars['Date']['input']>;
  id: Scalars['UUID']['input'];
};


export type MutationUpdateMovementActivityArgs = {
  amount: Scalars['Float']['input'];
  id: Scalars['UUID']['input'];
};


export type MutationUpdateProjectArgs = {
  emoji?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['Date']['input']>;
  id: Scalars['UUID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['Date']['input']>;
};


export type MutationUpdateTransactionArgs = {
  activityId: Scalars['UUID']['input'];
  amount?: InputMaybe<Scalars['Float']['input']>;
  fromAccount?: InputMaybe<Scalars['UUID']['input']>;
  fromUser?: InputMaybe<Scalars['UUID']['input']>;
  id: Scalars['UUID']['input'];
  toAccount?: InputMaybe<Scalars['UUID']['input']>;
  toUser?: InputMaybe<Scalars['UUID']['input']>;
};


export type MutationUpdateUserArgs = {
  avatar?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
};

export type Project = {
  emoji: Maybe<Scalars['String']['output']>;
  endDate: Maybe<Scalars['Date']['output']>;
  id: Scalars['UUID']['output'];
  name: Scalars['String']['output'];
  startDate: Maybe<Scalars['Date']['output']>;
  workspace: Maybe<Scalars['UUID']['output']>;
};

export type Query = {
  accounts: Array<Account>;
  activities: Array<Activity>;
  activityCategories: Array<ActivityCategory>;
  activitySubcategories: Array<ActivitySubCategory>;
  events: Array<Event>;
  movements: Array<Movement>;
  projects: Array<Project>;
  settings: Settings;
  users: Array<User>;
  workspace: Workspace;
  workspaceSettings: WorkspaceSettings;
  workspaces: Array<Workspace>;
};


export type QueryActivitiesArgs = {
  workspaceId?: InputMaybe<Scalars['UUID']['input']>;
};


export type QueryActivityCategoriesArgs = {
  workspaceId?: InputMaybe<Scalars['UUID']['input']>;
};


export type QueryActivitySubcategoriesArgs = {
  workspaceId?: InputMaybe<Scalars['UUID']['input']>;
};


export type QueryEventsArgs = {
  lastSync: Scalars['Float']['input'];
};


export type QueryMovementsArgs = {
  workspaceId?: InputMaybe<Scalars['UUID']['input']>;
};


export type QueryProjectsArgs = {
  workspaceId?: InputMaybe<Scalars['UUID']['input']>;
};


export type QueryWorkspaceArgs = {
  id: Scalars['UUID']['input'];
};


export type QueryWorkspaceSettingsArgs = {
  workspaceId: Scalars['UUID']['input'];
};

export type Settings = {
  currency: Scalars['String']['output'];
  startingPeriod: Scalars['String']['output'];
};

export type Subscription = {
  /** Events related to posts */
  events: Event;
};

export type Transaction = {
  amount: Scalars['Float']['output'];
  fromAccount: Maybe<Scalars['UUID']['output']>;
  fromUser: Maybe<Scalars['UUID']['output']>;
  id: Scalars['UUID']['output'];
  toAccount: Maybe<Scalars['UUID']['output']>;
  toUser: Maybe<Scalars['UUID']['output']>;
};

export type TransactionInput = {
  amount: Scalars['Float']['input'];
  fromAccount: Scalars['UUID']['input'];
  id: Scalars['UUID']['input'];
  toAccount: Scalars['UUID']['input'];
};

export type User = {
  avatar: Maybe<Scalars['String']['output']>;
  email: Scalars['String']['output'];
  firstName: Scalars['String']['output'];
  id: Scalars['UUID']['output'];
  lastName: Scalars['String']['output'];
};

export type Workspace = {
  createdAt: Scalars['String']['output'];
  currency: Scalars['String']['output'];
  id: Scalars['UUID']['output'];
  name: Scalars['String']['output'];
  startingDate: Maybe<Scalars['String']['output']>;
};

export type WorkspaceSettings = {
  currency: Scalars['String']['output'];
  startingPeriod: Maybe<Scalars['String']['output']>;
};

export type TestQueryVariables = Exact<{ [key: string]: never; }>;


export type TestQuery = { activities: Array<{ id: string, name: string }> };


export const TestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Test"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<TestQuery, TestQueryVariables>;