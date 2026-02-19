CREATE TABLE `assets` (
	`id` text PRIMARY KEY NOT NULL,
	`account` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`location` text,
	`value` integer DEFAULT 0 NOT NULL,
	`workspace` text NOT NULL,
	FOREIGN KEY (`account`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`workspace`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action
);
