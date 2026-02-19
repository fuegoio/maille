PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`amount` integer NOT NULL,
	`from_account` text NOT NULL,
	`from_asset` text,
	`from_counterparty` text,
	`to_account` text NOT NULL,
	`to_asset` text,
	`to_counterparty` text,
	`activity` text NOT NULL,
	FOREIGN KEY (`from_account`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`from_asset`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`from_counterparty`) REFERENCES `counterparties`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_account`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_asset`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_counterparty`) REFERENCES `counterparties`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`activity`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_transactions`("id", "amount", "from_account", "from_asset", "from_counterparty", "to_account", "to_asset", "to_counterparty", "activity") SELECT "id", "amount", "from_account", "from_asset", "from_counterparty", "to_account", "to_asset", "to_counterparty", "activity" FROM `transactions`;--> statement-breakpoint
DROP TABLE `transactions`;--> statement-breakpoint
ALTER TABLE `__new_transactions` RENAME TO `transactions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;