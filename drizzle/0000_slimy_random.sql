CREATE TABLE `document_sections` (
	`id` text PRIMARY KEY NOT NULL,
	`manuscript_id` text NOT NULL,
	`parent_id` text,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`order_index` integer NOT NULL,
	`content` text NOT NULL,
	`table_data` text,
	`raw_html` text,
	`char_count` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`manuscript_id`) REFERENCES `manuscripts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `manuscripts` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text DEFAULT 'Untitled Manuscript' NOT NULL,
	`source_type` text NOT NULL,
	`source_url` text,
	`original_filename` text,
	`original_file_path` text,
	`page_count` integer NOT NULL,
	`page_count_confidence` text NOT NULL,
	`word_count` integer NOT NULL,
	`status` text DEFAULT 'intake' NOT NULL,
	`style_profile` text DEFAULT 'original_research' NOT NULL,
	`primary_provider` text,
	`ocr_used` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `processing_events` (
	`id` text PRIMARY KEY NOT NULL,
	`manuscript_id` text NOT NULL,
	`event_type` text NOT NULL,
	`event_severity` text NOT NULL,
	`detail` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`manuscript_id`) REFERENCES `manuscripts`(`id`) ON UPDATE no action ON DELETE cascade
);
