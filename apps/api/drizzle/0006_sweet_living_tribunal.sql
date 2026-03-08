ALTER TABLE "device_code" ALTER COLUMN "expires_at" SET DATA TYPE timestamp (6);--> statement-breakpoint
ALTER TABLE "device_code" ALTER COLUMN "last_polled_at" SET DATA TYPE timestamp (6);--> statement-breakpoint
ALTER TABLE "device_code" ALTER COLUMN "created_at" SET DATA TYPE timestamp (6);--> statement-breakpoint
ALTER TABLE "device_code" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "device_code" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (6);--> statement-breakpoint
ALTER TABLE "device_code" ALTER COLUMN "updated_at" SET DEFAULT now();