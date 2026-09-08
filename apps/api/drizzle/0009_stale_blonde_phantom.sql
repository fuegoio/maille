ALTER TABLE "activities" ADD COLUMN "history" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "movements" ADD COLUMN "history" jsonb DEFAULT '[]'::jsonb NOT NULL;