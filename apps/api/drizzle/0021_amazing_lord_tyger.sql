CREATE TABLE "asset_valuations" (
	"id" text PRIMARY KEY NOT NULL,
	"user" text NOT NULL,
	"asset" text NOT NULL,
	"date" timestamp NOT NULL,
	"value" real NOT NULL,
	CONSTRAINT "asset_valuations_asset_date_key" UNIQUE("asset","date")
);
--> statement-breakpoint
ALTER TABLE "asset_valuations" ADD CONSTRAINT "asset_valuations_user_user_id_fk" FOREIGN KEY ("user") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_valuations" ADD CONSTRAINT "asset_valuations_asset_assets_id_fk" FOREIGN KEY ("asset") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;