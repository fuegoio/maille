ALTER TABLE "accounts" ALTER COLUMN "starting_balance" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "starting_cash_balance" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "accounts_sharing" ADD COLUMN "proportion" real NULL;
UPDATE "accounts_sharing" SET "proportion" = 0.5;
ALTER TABLE "accounts_sharing" ALTER COLUMN "proportion" SET NOT NULL;
ALTER TABLE "movements" ALTER COLUMN "amount" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "movements_activities" ALTER COLUMN "amount" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "amount" SET DATA TYPE real;
