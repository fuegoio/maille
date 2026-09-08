CREATE TABLE "fund_allocations" (
	"id" text PRIMARY KEY NOT NULL,
	"user" text NOT NULL,
	"fund" text NOT NULL,
	"account" text NOT NULL,
	"amount" real NOT NULL
);
--> statement-breakpoint
-- Fund moves not tied to a transaction carry no account-side location, so
-- they cannot participate in fund positions. Fund labels now come from
-- transaction legs and opening allocations (fund_allocations) instead.
DELETE FROM "fund_moves" WHERE "transaction" IS NULL;
--> statement-breakpoint
ALTER TABLE "fund_moves" ALTER COLUMN "transaction" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "fund_allocations" ADD CONSTRAINT "fund_allocations_user_user_id_fk" FOREIGN KEY ("user") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fund_allocations" ADD CONSTRAINT "fund_allocations_fund_funds_id_fk" FOREIGN KEY ("fund") REFERENCES "public"."funds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fund_allocations" ADD CONSTRAINT "fund_allocations_account_accounts_id_fk" FOREIGN KEY ("account") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;