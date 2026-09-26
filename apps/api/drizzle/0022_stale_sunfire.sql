ALTER TABLE "investments" RENAME COLUMN "quantity" TO "initial_quantity";--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "from_investment" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "from_quantity" real;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "to_investment" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "to_quantity" real;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_from_investment_investments_id_fk" FOREIGN KEY ("from_investment") REFERENCES "public"."investments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_to_investment_investments_id_fk" FOREIGN KEY ("to_investment") REFERENCES "public"."investments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint