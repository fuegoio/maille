CREATE TABLE `counterparties` (
	`id` text PRIMARY KEY NOT NULL,
	`account` text NOT NULL,
	`workspace` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`user` text,
	`liability` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`account`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`workspace`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
