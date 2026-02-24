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
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  date: integer("date", { mode: "timestamp" }).notNull(),
  description: text("description"),
  user: text("user")
    .notNull()
    .references(() => user.id),
  number: integer("number").notNull(),
  type: text("type").notNull().$type<ActivityType>(),
  category: text("category").references(() => activityCategories.id),
  subcategory: text("subcategory").references(() => activitySubcategories.id),
  project: text("project").references(() => projects.id),
});

export const activitiesSharing = sqliteTable("activities_sharing", {
  id: text("id").primaryKey(),
  sharingId: text("sharing_id").notNull(),
  role: text("role").notNull().$type<"primary" | "secondary">(),
  activity: text("activity")
    .notNull()
    .references(() => activities.id),
  user: text("user")
    .notNull()
    .references(() => user.id),
});

export const activityCategories = sqliteTable("activity_categories", {
  id: text("id").primaryKey(),
  user: text("user")
    .notNull()
    .references(() => user.id),
  name: text("name").notNull(),
  type: text("type").notNull().$type<ActivityType>(),
});

export const activitySubcategories = sqliteTable("activity_subcategories", {
  id: text("id").primaryKey(),
  user: text("user")
    .notNull()
    .references(() => user.id),
  name: text("name").notNull(),
  category: text("category")
    .notNull()
    .references(() => activityCategories.id),
});

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  user: text("user")
    .notNull()
    .references(() => user.id),
  name: text("name").notNull(),
  emoji: text("emoji"),
  startDate: integer("start_date", { mode: "timestamp" }),
  endDate: integer("end_date", { mode: "timestamp" }),
});

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  activity: text("activity")
    .notNull()
    .references(() => activities.id),
  amount: integer("amount").notNull(),
  fromAccount: text("from_account")
    .notNull()
    .references(() => accounts.id),
  fromAsset: text("from_asset").references(() => assets.id),
  fromCounterparty: text("from_counterparty").references(() => counterparties.id),
  toAccount: text("to_account")
    .notNull()
    .references(() => accounts.id),
  toAsset: text("to_asset").references(() => assets.id),
  toCounterparty: text("to_counterparty").references(() => counterparties.id),
});

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  user: text("user")
    .notNull()
    .references(() => user.id),
  name: text("name").notNull(),
  type: text("type").notNull().$type<AccountType>(),
  startingBalance: integer("starting_balance").notNull().default(0),
  startingCashBalance: integer("starting_cash_balance").notNull().default(0),
  default: integer("default", { mode: "boolean" }).notNull().default(false),
  movements: integer("movements", { mode: "boolean" }).notNull().default(false),
});

export const accountsSharing = sqliteTable("accounts_sharing", {
  id: text("id").primaryKey(),
  sharingId: text("sharing_id").notNull(),
  role: text("role").notNull().$type<"primary" | "secondary">(),
  account: text("account")
    .notNull()
    .references(() => accounts.id),
  user: text("user")
    .notNull()
    .references(() => user.id),
});

export const assets = sqliteTable("assets", {
  id: text("id").primaryKey(),
  user: text("user")
    .notNull()
    .references(() => user.id),
  account: text("account")
    .notNull()
    .references(() => accounts.id),
  name: text("name").notNull(),
  description: text("description"),
  location: text("location"),
});

export const movements = sqliteTable("movements", {
  id: text("id").primaryKey(),
  user: text("user")
    .notNull()
    .references(() => user.id),
  date: integer("date", { mode: "timestamp" }).notNull(),
  amount: integer("amount").notNull(),
  account: text("account")
    .notNull()
    .references(() => accounts.id),
  name: text("name").notNull(),
});

export const movementsActivities = sqliteTable("movements_activities", {
  id: text("id").primaryKey(),
  activity: text("activity")
    .notNull()
    .references(() => activities.id),
  movement: text("movement")
    .notNull()
    .references(() => movements.id),
  amount: integer("amount").notNull(),
});

export const counterparties = sqliteTable("counterparties", {
  id: text("id").primaryKey(),
  user: text("user")
    .notNull()
    .references(() => user.id),
  account: text("account")
    .notNull()
    .references(() => accounts.id),
  name: text("name").notNull(),
  description: text("description"),
  contact: text("contact").references(() => user.id),
});

export const events = sqliteTable("events", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  user: text("user")
    .notNull()
    .references(() => user.id),
  type: text("type").notNull().$type<SyncEvent["type"]>(),
  payload: text("payload").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  clientId: text("client_id").notNull(),
});

export const contacts = sqliteTable("contacts", {
  id: text("id").primaryKey(),
  user: text("user")
    .notNull()
    .references(() => user.id),
  contact: text("contact")
    .notNull()
    .references(() => user.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
