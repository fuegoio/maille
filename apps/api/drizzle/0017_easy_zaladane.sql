ALTER TABLE "activities" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "activity_categories" DROP COLUMN "type";--> statement-breakpoint
DROP TYPE "public"."activity_type";