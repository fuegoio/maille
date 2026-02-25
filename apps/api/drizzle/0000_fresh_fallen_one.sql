CREATE TYPE "public"."account_type" AS ENUM('bank_account', 'investment_account', 'cash', 'liabilities', 'assets', 'expense', 'revenue');--> statement-breakpoint
CREATE TYPE "public"."activity_type" AS ENUM('expense', 'revenue', 'investment', 'neutral');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user" text NOT NULL,
	"name" text NOT NULL,
	"type" "account_type" NOT NULL,
	"starting_balance" integer DEFAULT 0 NOT NULL,
	"starting_cash_balance" integer DEFAULT 0 NOT NULL,
	"default" boolean DEFAULT false NOT NULL,
	"movements" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts_sharing" (
	"id" text PRIMARY KEY NOT NULL,
	"sharing_id" text NOT NULL,
	"role" text NOT NULL,
	"account" text NOT NULL,
	"user" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activities" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"date" timestamp NOT NULL,
	"description" text,
	"user" text NOT NULL,
	"number" integer NOT NULL,
	"type" "activity_type" NOT NULL,
	"category" text,
	"subcategory" text,
	"project" text
);
--> statement-breakpoint
CREATE TABLE "activities_sharing" (
	"id" text PRIMARY KEY NOT NULL,
	"sharing_id" text NOT NULL,
	"role" text NOT NULL,
	"activity" text NOT NULL,
	"user" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"user" text NOT NULL,
	"name" text NOT NULL,
	"type" "activity_type" NOT NULL,
);
--> statement-breakpoint
CREATE TABLE "activity_subcategories" (
	"id" text PRIMARY KEY NOT NULL,
	"user" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" text PRIMARY KEY NOT NULL,
	"user" text NOT NULL,
	"account" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"location" text
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" text PRIMARY KEY NOT NULL,
	"user" text NOT NULL,
	"contact" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "counterparties" (
	"id" text PRIMARY KEY NOT NULL,
	"user" text NOT NULL,
	"account" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"contact" text
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user" text NOT NULL,
	"type" text NOT NULL,
	"payload" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"client_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "movements" (
	"id" text PRIMARY KEY NOT NULL,
	"user" text NOT NULL,
	"date" timestamp NOT NULL,
	"amount" integer NOT NULL,
	"account" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "movements_activities" (
	"id" text PRIMARY KEY NOT NULL,
	"activity" text NOT NULL,
	"movement" text NOT NULL,
	"amount" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"user" text NOT NULL,
	"name" text NOT NULL,
	"emoji" text,
	"start_date" timestamp,
	"end_date" timestamp
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"activity" text NOT NULL,
	"amount" integer NOT NULL,
	"from_account" text NOT NULL,
	"from_asset" text,
	"from_counterparty" text,
	"to_account" text NOT NULL,
	"to_asset" text,
	"to_counterparty" text
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"starting_date" timestamp,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_user_id_fk" FOREIGN KEY ("user") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_sharing" ADD CONSTRAINT "accounts_sharing_account_accounts_id_fk" FOREIGN KEY ("account") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_sharing" ADD CONSTRAINT "accounts_sharing_user_user_id_fk" FOREIGN KEY ("user") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_user_id_fk" FOREIGN KEY ("user") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_category_activity_categories_id_fk" FOREIGN KEY ("category") REFERENCES "public"."activity_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_subcategory_activity_subcategories_id_fk" FOREIGN KEY ("subcategory") REFERENCES "public"."activity_subcategories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_project_projects_id_fk" FOREIGN KEY ("project") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities_sharing" ADD CONSTRAINT "activities_sharing_activity_activities_id_fk" FOREIGN KEY ("activity") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities_sharing" ADD CONSTRAINT "activities_sharing_user_user_id_fk" FOREIGN KEY ("user") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_categories" ADD CONSTRAINT "activity_categories_user_user_id_fk" FOREIGN KEY ("user") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_subcategories" ADD CONSTRAINT "activity_subcategories_user_user_id_fk" FOREIGN KEY ("user") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_subcategories" ADD CONSTRAINT "activity_subcategories_category_activity_categories_id_fk" FOREIGN KEY ("category") REFERENCES "public"."activity_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_user_user_id_fk" FOREIGN KEY ("user") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_account_accounts_id_fk" FOREIGN KEY ("account") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_user_user_id_fk" FOREIGN KEY ("user") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_contact_user_id_fk" FOREIGN KEY ("contact") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counterparties" ADD CONSTRAINT "counterparties_user_user_id_fk" FOREIGN KEY ("user") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counterparties" ADD CONSTRAINT "counterparties_account_accounts_id_fk" FOREIGN KEY ("account") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counterparties" ADD CONSTRAINT "counterparties_contact_user_id_fk" FOREIGN KEY ("contact") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_user_user_id_fk" FOREIGN KEY ("user") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movements" ADD CONSTRAINT "movements_user_user_id_fk" FOREIGN KEY ("user") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movements" ADD CONSTRAINT "movements_account_accounts_id_fk" FOREIGN KEY ("account") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movements_activities" ADD CONSTRAINT "movements_activities_activity_activities_id_fk" FOREIGN KEY ("activity") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movements_activities" ADD CONSTRAINT "movements_activities_movement_movements_id_fk" FOREIGN KEY ("movement") REFERENCES "public"."movements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_user_id_fk" FOREIGN KEY ("user") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_activity_activities_id_fk" FOREIGN KEY ("activity") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_from_account_accounts_id_fk" FOREIGN KEY ("from_account") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_from_asset_assets_id_fk" FOREIGN KEY ("from_asset") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_from_counterparty_counterparties_id_fk" FOREIGN KEY ("from_counterparty") REFERENCES "public"."counterparties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_to_account_accounts_id_fk" FOREIGN KEY ("to_account") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_to_asset_assets_id_fk" FOREIGN KEY ("to_asset") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_to_counterparty_counterparties_id_fk" FOREIGN KEY ("to_counterparty") REFERENCES "public"."counterparties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");
