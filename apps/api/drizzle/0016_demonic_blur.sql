ALTER TABLE "transactions" ADD COLUMN "fund_moves" jsonb;--> statement-breakpoint
-- Fold the fund move collection into its transactions: a leg exists only
-- as part of its transaction. Drizzle stores timestamps as UTC ISO, so the
-- date is reproduced with the same wall time the API used to serve.
UPDATE "transactions" SET "fund_moves" = (
  SELECT jsonb_agg(jsonb_build_object(
    'id', fm.id,
    'fromFund', fm.from_fund,
    'toFund', fm.to_fund,
    'amount', fm.amount,
    'date', to_char(fm.date, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'note', fm.note
  ) ORDER BY fm.date)
  FROM fund_moves fm WHERE fm.transaction = "transactions".id
);--> statement-breakpoint
DROP TABLE "fund_moves" CASCADE;--> statement-breakpoint
CREATE TABLE "movement_workflows" (
	"id" text PRIMARY KEY NOT NULL,
	"user" text NOT NULL,
	"movement" text NOT NULL,
	"status" text NOT NULL,
	"trigger" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"result" jsonb,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "movement_workflows_movement_unique" UNIQUE("movement")
);--> statement-breakpoint
ALTER TABLE "movement_workflows" ADD CONSTRAINT "movement_workflows_user_user_id_fk" FOREIGN KEY ("user") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movement_workflows" ADD CONSTRAINT "movement_workflows_movement_movements_id_fk" FOREIGN KEY ("movement") REFERENCES "public"."movements"("id") ON DELETE cascade ON UPDATE no action;
