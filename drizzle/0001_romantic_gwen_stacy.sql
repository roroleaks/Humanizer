CREATE TABLE `refinement_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`manuscript_id` text NOT NULL,
	`style_profile` text NOT NULL,
	`intensity` text NOT NULL,
	`primary_provider` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`total_chunks` integer DEFAULT 0 NOT NULL,
	`completed_chunks` integer DEFAULT 0 NOT NULL,
	`failed_chunks` integer DEFAULT 0 NOT NULL,
	`started_at` integer,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`manuscript_id`) REFERENCES `manuscripts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `refinement_chunks` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`manuscript_id` text NOT NULL,
	`section_id` text NOT NULL,
	`chunk_index` integer NOT NULL,
	`paragraph_ids` text NOT NULL,
	`original_text` text NOT NULL,
	`refined_text` text,
	`change_level` text,
	`word_count` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`provider_used` text,
	`model_used` text,
	`tokens_used` integer DEFAULT 0,
	`flags` text,
	`error_message` text,
	`started_at` integer,
	`completed_at` integer,
	FOREIGN KEY (`job_id`) REFERENCES `refinement_jobs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`manuscript_id`) REFERENCES `manuscripts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `manuscripts` ADD `refinement_consent_at` integer;