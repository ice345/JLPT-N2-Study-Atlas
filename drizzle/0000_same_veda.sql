CREATE TABLE `ai_study_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`source_attempt_count` integer NOT NULL,
	`payload` text NOT NULL,
	`generated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `practice_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`session_id` text NOT NULL,
	`question_id` text NOT NULL,
	`area` text NOT NULL,
	`skill` text NOT NULL,
	`selected_answer` integer NOT NULL,
	`correct` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `practice_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`mode` text NOT NULL,
	`area` text NOT NULL,
	`question_ids` text NOT NULL,
	`answers` text DEFAULT '{}' NOT NULL,
	`started_at` text NOT NULL,
	`completed_at` text
);
--> statement-breakpoint
CREATE TABLE `study_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`target_exam_date` text,
	`daily_minutes` integer DEFAULT 25 NOT NULL,
	`updated_at` text NOT NULL
);
