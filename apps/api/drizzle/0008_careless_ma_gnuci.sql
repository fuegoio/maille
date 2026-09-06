CREATE TABLE "fund_moves" (
	"id" text PRIMARY KEY NOT NULL,
	"user" text NOT NULL,
	"from_fund" text,
	"to_fund" text,
	"amount" real NOT NULL,
	"date" timestamp NOT NULL,
	"note" text,
	"transaction" text
);
--> statement-breakpoint
CREATE TABLE "funds" (
	"id" text PRIMARY KEY NOT NULL,
	"user" text NOT NULL,
	"name" text NOT NULL,
	"emoji" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp
);
--> statement-breakpoint
ALTER TABLE "fund_moves" ADD CONSTRAINT "fund_moves_user_user_id_fk" FOREIGN KEY ("user") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fund_moves" ADD CONSTRAINT "fund_moves_from_fund_funds_id_fk" FOREIGN KEY ("from_fund") REFERENCES "public"."funds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fund_moves" ADD CONSTRAINT "fund_moves_to_fund_funds_id_fk" FOREIGN KEY ("to_fund") REFERENCES "public"."funds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fund_moves" ADD CONSTRAINT "fund_moves_transaction_transactions_id_fk" FOREIGN KEY ("transaction") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funds" ADD CONSTRAINT "funds_user_user_id_fk" FOREIGN KEY ("user") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;