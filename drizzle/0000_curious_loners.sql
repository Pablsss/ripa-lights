CREATE TABLE `quiz_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`mode` text NOT NULL,
	`started_at` text NOT NULL,
	`completed_at` text,
	`score` integer,
	`questions_json` text NOT NULL,
	`answers_json` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_quiz_attempts_user_started` ON `quiz_attempts` (`user_id`,`started_at`);