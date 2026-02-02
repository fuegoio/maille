CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user` text,
	`workspace` text,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`starting_balance` integer DEFAULT 0 NOT NULL,
	`starting_cash_balance` integer DEFAULT 0 NOT NULL,
	`default` integer DEFAULT false NOT NULL,
	`movements` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`workspace`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `activities` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`date` integer NOT NULL,
	`description` text,
	`user` text NOT NULL,
	`workspace` text,
	`number` integer NOT NULL,
	`type` text NOT NULL,
	`category` text,
	`subcategory` text,
	`project` text,
	FOREIGN KEY (`user`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`workspace`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category`) REFERENCES `activity_categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`subcategory`) REFERENCES `activity_subcategories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `activity_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`user` text NOT NULL,
	`workspace` text,
	`name` text NOT NULL,
	`type` text NOT NULL,
	FOREIGN KEY (`workspace`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `activity_subcategories` (
	`id` text PRIMARY KEY NOT NULL,
	`user` text NOT NULL,
	`workspace` text,
	`name` text NOT NULL,
	`category` text NOT NULL,
	FOREIGN KEY (`workspace`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category`) REFERENCES `activity_categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user` text NOT NULL,
	`type` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` integer NOT NULL,
	`client_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `movements` (
	`id` text PRIMARY KEY NOT NULL,
	`user` text NOT NULL,
	`workspace` text,
	`date` integer NOT NULL,
	`amount` integer NOT NULL,
	`account` text NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`workspace`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`account`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `movements_activities` (
	`id` text PRIMARY KEY NOT NULL,
	`user` text NOT NULL,
	`workspace` text,
	`activity` text NOT NULL,
	`movement` text NOT NULL,
	`amount` integer NOT NULL,
	FOREIGN KEY (`workspace`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`activity`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`movement`) REFERENCES `movements`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`user` text NOT NULL,
	`workspace` text,
	`name` text NOT NULL,
	`emoji` text,
	`start_date` integer,
	`end_date` integer,
	FOREIGN KEY (`workspace`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`amount` integer NOT NULL,
	`from_account` text,
	`from_user` text,
	`to_account` text,
	`to_user` text,
	`activity` text NOT NULL,
	FOREIGN KEY (`from_account`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`from_user`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_account`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_user`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`activity`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`avatar` text,
	`email` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`password` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`starting_date` text,
	`currency` text NOT NULL,
	`created_at` integer NOT NULL
);
