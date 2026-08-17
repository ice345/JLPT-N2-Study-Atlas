CREATE TABLE `auth_identities` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`provider_user_id` text NOT NULL,
	`email` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_identity_provider_user_unique` ON `auth_identities` (`provider`,`provider_user_id`);--> statement-breakpoint
CREATE INDEX `auth_identity_user_idx` ON `auth_identities` (`user_id`);--> statement-breakpoint
CREATE TABLE `study_events` (
	`id` text PRIMARY KEY NOT NULL,
	`client_event_id` text NOT NULL,
	`user_id` text NOT NULL,
	`device_id` text NOT NULL,
	`type` text NOT NULL,
	`content_type` text NOT NULL,
	`content_id` text NOT NULL,
	`domain` text NOT NULL,
	`skill` text,
	`rating` text,
	`correct` integer,
	`duration_seconds` integer,
	`created_at` text NOT NULL,
	`received_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `study_events_user_client_event_unique` ON `study_events` (`user_id`,`client_event_id`);--> statement-breakpoint
CREATE INDEX `study_events_user_created_idx` ON `study_events` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `study_events_user_received_idx` ON `study_events` (`user_id`,`received_at`);--> statement-breakpoint
CREATE INDEX `study_events_user_content_idx` ON `study_events` (`user_id`,`content_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text,
	`email` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `users_email_idx` ON `users` (`email`);