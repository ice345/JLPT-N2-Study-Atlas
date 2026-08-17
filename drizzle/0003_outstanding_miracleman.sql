ALTER TABLE `practice_sessions` ADD `seed` text;--> statement-breakpoint
ALTER TABLE `study_events` ADD `problem_id` text;--> statement-breakpoint
ALTER TABLE `study_events` ADD `unit_id` text;--> statement-breakpoint
CREATE INDEX `study_events_user_problem_idx` ON `study_events` (`user_id`,`problem_id`);--> statement-breakpoint
CREATE INDEX `study_events_user_unit_idx` ON `study_events` (`user_id`,`unit_id`);--> statement-breakpoint
PRAGMA optimize;
