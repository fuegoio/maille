import { text, integer, sqliteTable, index } from "drizzle-orm/sqlite-core";
import type { ActivityType } from "@maille/core/activities";
import { AccountType } from "@maille/core/accounts";
import type { SyncEvent } from "@maille/core/sync";
import { relations } from "drizzle-orm";

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false).notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", {
      mode: "timestamp_ms",
    }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", {
      mode: "timestamp_ms",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const activities = sqliteTable("activities", {
  id: text("id").primaryKey().$type<string>(),
  name: text("name").notNull(),
  date: integer("date", { mode: "timestamp" }).notNull(),
  description: text("description"),
  user: text("user")
    .notNull()
    .references(() => user.id),
  workspace: text("workspace")
    .notNull()
    .$type<string>()
    .references(() => workspaces.id),
  number: integer("number").notNull(),
  type: text("type").notNull().$type<ActivityType>(),
  category: text("category")
    .$type<string>()
    .references(() => activityCategories.id),
  subcategory: text("subcategory")
    .$type<string>()
    .references(() => activitySubcategories.id),
  project: text("project")
    .$type<string>()
    .references(() => projects.id),
});

export const activityCategories = sqliteTable("activity_categories", {
  id: text("id").primaryKey().$type<string>(),
  workspace: text("workspace")
    .notNull()
    .$type<string>()
    .references(() => workspaces.id),
  name: text("name").notNull(),
  type: text("type").notNull().$type<ActivityType>(),
});

export const activitySubcategories = sqliteTable("activity_subcategories", {
  id: text("id").primaryKey().$type<string>(),
  workspace: text("workspace")
    .notNull()
    .$type<string>()
    .references(() => workspaces.id),
  name: text("name").notNull(),
  category: text("category")
    .notNull()
    .$type<string>()
    .references(() => activityCategories.id),
});

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey().$type<string>(),
  workspace: text("workspace")
    .notNull()
    .$type<string>()
    .references(() => workspaces.id),
  name: text("name").notNull(),
  emoji: text("emoji"),
  startDate: integer("start_date", { mode: "timestamp" }),
  endDate: integer("end_date", { mode: "timestamp" }),
});

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey().$type<string>(),
  amount: integer("amount").notNull(),
  fromAccount: text("from_account")
    .notNull()
    .$type<string>()
    .references(() => accounts.id),
  fromUser: text("from_user").references(() => user.id),
  toAccount: text("to_account")
    .notNull()
    .$type<string>()
    .references(() => accounts.id),
  toUser: text("to_user").references(() => user.id),
  activity: text("activity")
    .notNull()
    .references(() => activities.id)
    .$type<string>(),
});

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey().$type<string>(),
  user: text("user"),
  workspace: text("workspace")
    .notNull()
    .$type<string>()
    .references(() => workspaces.id),
  name: text("name").notNull(),
  type: text("type").notNull().$type<AccountType>(),
  startingBalance: integer("starting_balance").notNull().default(0),
  startingCashBalance: integer("starting_cash_balance").notNull().default(0),
  default: integer("default", { mode: "boolean" }).notNull().default(false),
  movements: integer("movements", { mode: "boolean" }).notNull().default(false),
});

export const assets = sqliteTable("assets", {
  id: text("id").primaryKey().$type<string>(),
  account: text("account")
    .notNull()
    .$type<string>()
    .references(() => accounts.id),
  name: text("name").notNull(),
  description: text("description"),
  location: text("location"),
  value: integer("value").notNull().default(0),
  workspace: text("workspace")
    .notNull()
    .$type<string>()
    .references(() => workspaces.id),
});

export const movements = sqliteTable("movements", {
  id: text("id").primaryKey().$type<string>(),
  user: text("user").notNull(),
  workspace: text("workspace")
    .notNull()
    .$type<string>()
    .references(() => workspaces.id),
  date: integer("date", { mode: "timestamp" }).notNull(),
  amount: integer("amount").notNull(),
  account: text("account")
    .notNull()
    .references(() => accounts.id)
    .$type<string>(),
  name: text("name").notNull(),
});

export const movementsActivities = sqliteTable("movements_activities", {
  id: text("id").primaryKey().$type<string>(),
  workspace: text("workspace")
    .notNull()
    .$type<string>()
    .references(() => workspaces.id),
  activity: text("activity")
    .notNull()
    .references(() => activities.id)
    .$type<string>(),
  movement: text("movement")
    .notNull()
    .references(() => movements.id)
    .$type<string>(),
  amount: integer("amount").notNull(),
});

export const events = sqliteTable("events", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  user: text("user").notNull(),
  type: text("type").notNull().$type<SyncEvent["type"]>(),
  payload: text("payload").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  clientId: text("client_id").notNull(),
  workspace: text("workspace")
    .notNull()
    .$type<string>()
    .references(() => workspaces.id),
});

export const workspaces = sqliteTable("workspaces", {
  id: text("id").primaryKey().$type<string>(),
  name: text("name").notNull(),
  startingDate: integer("starting_date", { mode: "timestamp" }).notNull(),
  currency: text("currency").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const workspaceUsers = sqliteTable("workspace_users", {
  id: text("id").primaryKey().$type<string>(),
  user: text("user")
    .notNull()
    .references(() => user.id),
  workspace: text("workspace")
    .notNull()
    .$type<string>()
    .references(() => workspaces.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
