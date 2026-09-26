CREATE TABLE "investment_prices" (
	"id" text PRIMARY KEY NOT NULL,
	"user" text NOT NULL,
	"investment" text NOT NULL,
	"date" timestamp NOT NULL,
	"price" real NOT NULL,
	CONSTRAINT "investment_prices_investment_date_key" UNIQUE("investment","date")
);
--> statement-breakpoint
CREATE TABLE "investments" (
	"id" text PRIMARY KEY NOT NULL,
	"user" text NOT NULL,
	"account" text NOT NULL,
	"name" text NOT NULL,
	"symbol" text,
	"description" text,
	"quantity" real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "investment_prices" ADD CONSTRAINT "investment_prices_user_user_id_fk" FOREIGN KEY ("user") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_prices" ADD CONSTRAINT "investment_prices_investment_investments_id_fk" FOREIGN KEY ("investment") REFERENCES "public"."investments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investments" ADD CONSTRAINT "investments_user_user_id_fk" FOREIGN KEY ("user") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investments" ADD CONSTRAINT "investments_account_accounts_id_fk" FOREIGN KEY ("account") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;