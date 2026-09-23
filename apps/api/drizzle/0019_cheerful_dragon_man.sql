CREATE TABLE "asset_depreciations" (
	"id" text PRIMARY KEY NOT NULL,
	"user" text NOT NULL,
	"asset" text NOT NULL,
	"method" text NOT NULL,
	"basis" real NOT NULL,
	"months" integer NOT NULL,
	"start_month" timestamp NOT NULL,
	"expense_account" text NOT NULL,
	"category" text,
	"subcategory" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "asset_depreciations_asset_unique" UNIQUE("asset")
);
--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "depreciation" text;--> statement-breakpoint
ALTER TABLE "asset_depreciations" ADD CONSTRAINT "asset_depreciations_user_user_id_fk" FOREIGN KEY ("user") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_depreciations" ADD CONSTRAINT "asset_depreciations_asset_assets_id_fk" FOREIGN KEY ("asset") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_depreciations" ADD CONSTRAINT "asset_depreciations_expense_account_accounts_id_fk" FOREIGN KEY ("expense_account") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_depreciations" ADD CONSTRAINT "asset_depreciations_category_activity_categories_id_fk" FOREIGN KEY ("category") REFERENCES "public"."activity_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_depreciations" ADD CONSTRAINT "asset_depreciations_subcategory_activity_subcategories_id_fk" FOREIGN KEY ("subcategory") REFERENCES "public"."activity_subcategories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_depreciation_asset_depreciations_id_fk" FOREIGN KEY ("depreciation") REFERENCES "public"."asset_depreciations"("id") ON DELETE set null ON UPDATE no action;