CREATE TABLE `ai_credentials` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`endpoint` text NOT NULL,
	`model` text NOT NULL,
	`ciphertext` text NOT NULL,
	`iv` text NOT NULL,
	`key_version` integer DEFAULT 1 NOT NULL,
	`last_four` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ai_credentials_user_unique` ON `ai_credentials` (`user_id`);--> statement-breakpoint
CREATE INDEX `ai_credentials_user_idx` ON `ai_credentials` (`user_id`);