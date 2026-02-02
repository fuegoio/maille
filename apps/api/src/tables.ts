import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";
import type { UUID } from "crypto";
import type { ActivityType } from "@maille/core/activities";
import { AccountType } from "@maille/core/accounts";
import type { SyncEvent } from "@maille/core/sync";

export const activities = sqliteTable("activities", {
  id: text("id").primaryKey().$type<UUID>(),
  name: text("name").notNull(),
  date: integer("date", { mode: "timestamp" }).notNull(),
  description: text("description"),
  user: text("user")
    .notNull()
    .$type<UUID>()
    .references(() => users.id),
  workspace: text("workspace")
    .notNull()
    .$type<UUID>()
    .references(() => workspaces.id),
  number: integer("number").notNull(),
  type: text("type").notNull().$type<ActivityType>(),
  category: text("category")
    .$type<UUID>()
    .references(() => activityCategories.id),
  subcategory: text("subcategory")
    .$type<UUID>()
    .references(() => activitySubcategories.id),
  project: text("project")
    .$type<UUID>()
    .references(() => projects.id),
});

export const activityCategories = sqliteTable("activity_categories", {
  id: text("id").primaryKey().$type<UUID>(),
  user: text("user").notNull().$type<UUID>(),
  workspace: text("workspace")
    .notNull()
    .$type<UUID>()
    .references(() => workspaces.id),
  name: text("name").notNull(),
  type: text("type").notNull().$type<ActivityType>(),
});

export const activitySubcategories = sqliteTable("activity_subcategories", {
  id: text("id").primaryKey().$type<UUID>(),
  user: text("user").notNull().$type<UUID>(),
  workspace: text("workspace")
    .notNull()
    .$type<UUID>()
    .references(() => workspaces.id),
  name: text("name").notNull(),
  category: text("category")
    .notNull()
    .$type<UUID>()
    .references(() => activityCategories.id),
});

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey().$type<UUID>(),
  user: text("user").notNull().$type<UUID>(),
  workspace: text("workspace")
    .notNull()
    .$type<UUID>()
    .references(() => workspaces.id),
  name: text("name").notNull(),
  emoji: text("emoji"),
  startDate: integer("start_date", { mode: "timestamp" }),
  endDate: integer("end_date", { mode: "timestamp" }),
});

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey().$type<UUID>(),
  amount: integer("amount").notNull(),
  fromAccount: text("from_account")
    .$type<UUID>()
    .references(() => accounts.id),
  fromUser: text("from_user")
    .$type<UUID>()
    .references(() => users.id),
  toAccount: text("to_account")
    .$type<UUID>()
    .references(() => accounts.id),
  toUser: text("to_user")
    .$type<UUID>()
    .references(() => users.id),
  activity: text("activity")
    .notNull()
    .references(() => activities.id)
    .$type<UUID>(),
});

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey().$type<UUID>(),
  user: text("user").$type<UUID | null>(),
  workspace: text("workspace")
    .notNull()
    .$type<UUID>()
    .references(() => workspaces.id),
  name: text("name").notNull(),
  type: text("type").notNull().$type<AccountType>(),
  startingBalance: integer("starting_balance").notNull().default(0),
  startingCashBalance: integer("starting_cash_balance").notNull().default(0),
  default: integer("default", { mode: "boolean" }).notNull().default(false),
  movements: integer("movements", { mode: "boolean" }).notNull().default(false),
});

export const movements = sqliteTable("movements", {
  id: text("id").primaryKey().$type<UUID>(),
  user: text("user").notNull().$type<UUID>(),
  workspace: text("workspace")
    .notNull()
    .$type<UUID>()
    .references(() => workspaces.id),
  date: integer("date", { mode: "timestamp" }).notNull(),
  amount: integer("amount").notNull(),
  account: text("account")
    .notNull()
    .references(() => accounts.id)
    .$type<UUID>(),
  name: text("name").notNull(),
});

export const movementsActivities = sqliteTable("movements_activities", {
  id: text("id").primaryKey().$type<UUID>(),
  user: text("user").notNull().$type<UUID>(),
  workspace: text("workspace")
    .notNull()
    .$type<UUID>()
    .references(() => workspaces.id),
  activity: text("activity")
    .notNull()
    .references(() => activities.id)
    .$type<UUID>(),
  movement: text("movement")
    .notNull()
    .references(() => movements.id)
    .$type<UUID>(),
  amount: integer("amount").notNull(),
});

export const events = sqliteTable("events", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  user: text("user").notNull().$type<UUID>(),
  type: text("type").notNull().$type<SyncEvent["type"]>(),
  payload: text("payload").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  clientId: text("client_id").notNull().$type<UUID>(),
});

export const workspaces = sqliteTable("workspaces", {
  id: text("id").primaryKey().$type<UUID>(),
  name: text("name").notNull(),
  startingDate: text("starting_date"),
  currency: text("currency").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$type<UUID>(),
  avatar: text("avatar"),
  email: text("email").notNull(),
  first_name: text("first_name").notNull(),
  last_name: text("last_name").notNull(),
  password: text("password").notNull(),
});

export const workspaceUsers = sqliteTable("workspace_users", {
  id: text("id").primaryKey().$type<UUID>(),
  user: text("user")
    .notNull()
    .$type<UUID>()
    .references(() => users.id),
  workspace: text("workspace")
    .notNull()
    .$type<UUID>()
    .references(() => workspaces.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
