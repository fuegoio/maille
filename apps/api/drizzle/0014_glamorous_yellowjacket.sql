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
);
--> statement-breakpoint
ALTER TABLE "movement_workflows" ADD CONSTRAINT "movement_workflows_user_user_id_fk" FOREIGN KEY ("user") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movement_workflows" ADD CONSTRAINT "movement_workflows_movement_movements_id_fk" FOREIGN KEY ("movement") REFERENCES "public"."movements"("id") ON DELETE cascade ON UPDATE no action;