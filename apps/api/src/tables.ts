import {
  text,
  integer,
  pgTable,
  index,
  serial,
  timestamp,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { ActivityType } from "@maille/core/activities";
import { AccountType } from "@maille/core/accounts";
import type { SyncEvent } from "@maille/core/sync";
import { relations } from "drizzle-orm";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  currency: text("currency").notNull().default("EUR"),
  startingDate: timestamp("starting_date", { mode: "date" }),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
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
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
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

export const activityTypeEnum = pgEnum("activity_type", ActivityType);

export const activities = pgTable("activities", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  date: timestamp("date", { mode: "date" }).notNull(),
  description: text("description"),
  user: text("user")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  number: integer("number").notNull(),
  type: activityTypeEnum("type").notNull(),
  category: text("category").references(() => activityCategories.id, { onDelete: "set null" }),
  subcategory: text("subcategory").references(() => activitySubcategories.id, {
    onDelete: "set null",
  }),
  project: text("project").references(() => projects.id, { onDelete: "set null" }),
});

export const activitiesSharing = pgTable("activities_sharing", {
  id: text("id").primaryKey(),
  sharingId: text("sharing_id").notNull(),
  role: text("role").notNull().$type<"primary" | "secondary">(),
  activity: text("activity")
    .notNull()
    .references(() => activities.id, { onDelete: "cascade" }),
  user: text("user")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const activityCategories = pgTable("activity_categories", {
  id: text("id").primaryKey(),
  user: text("user")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: activityTypeEnum("type").notNull(),
});

export const activitySubcategories = pgTable("activity_subcategories", {
  id: text("id").primaryKey(),
  user: text("user")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category")
    .notNull()
    .references(() => activityCategories.id, { onDelete: "cascade" }),
});

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  user: text("user")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  emoji: text("emoji"),
  startDate: timestamp("start_date", { mode: "date" }),
  endDate: timestamp("end_date", { mode: "date" }),
});

export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  activity: text("activity")
    .notNull()
    .references(() => activities.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  fromAccount: text("from_account")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  fromAsset: text("from_asset").references(() => assets.id, { onDelete: "set null" }),
  fromCounterparty: text("from_counterparty").references(() => counterparties.id, {
    onDelete: "set null",
  }),
  toAccount: text("to_account")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  toAsset: text("to_asset").references(() => assets.id, { onDelete: "set null" }),
  toCounterparty: text("to_counterparty").references(() => counterparties.id, {
    onDelete: "set null",
  }),
});

export const accountTypeEnum = pgEnum("account_type", AccountType);

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  user: text("user")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: accountTypeEnum("type").notNull(),
  startingBalance: integer("starting_balance").notNull().default(0),
  startingCashBalance: integer("starting_cash_balance").notNull().default(0),
  default: boolean("default").notNull().default(false),
  movements: boolean("movements").notNull().default(false),
});

export const accountsSharing = pgTable("accounts_sharing", {
  id: text("id").primaryKey(),
  sharingId: text("sharing_id").notNull(),
  role: text("role").notNull().$type<"primary" | "secondary">(),
  account: text("account")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  user: text("user")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const assets = pgTable("assets", {
  id: text("id").primaryKey(),
  user: text("user")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  account: text("account")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  location: text("location"),
});

export const movements = pgTable("movements", {
  id: text("id").primaryKey(),
  user: text("user")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  date: timestamp("date", { mode: "date" }).notNull(),
  amount: integer("amount").notNull(),
  account: text("account")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
});

export const movementsActivities = pgTable("movements_activities", {
  id: text("id").primaryKey(),
  activity: text("activity")
    .notNull()
    .references(() => activities.id, { onDelete: "cascade" }),
  movement: text("movement")
    .notNull()
    .references(() => movements.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
});

export const counterparties = pgTable("counterparties", {
  id: text("id").primaryKey(),
  user: text("user")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  account: text("account")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  contact: text("contact").references(() => user.id, { onDelete: "set null" }),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  user: text("user")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: text("type").notNull().$type<SyncEvent["type"]>(),
  payload: text("payload").notNull(),
  createdAt: timestamp("created_at").notNull(),
  clientId: text("client_id").notNull(),
});

export const contacts = pgTable("contacts", {
  id: text("id").primaryKey(),
  user: text("user")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  contact: text("contact")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull(),
});
