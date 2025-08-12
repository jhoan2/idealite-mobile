CREATE TABLE `pages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`server_id` text,
	`title` text NOT NULL,
	`content` text,
	`content_type` text DEFAULT 'page' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`is_dirty` integer DEFAULT false NOT NULL,
	`last_synced_at` text,
	`deleted` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pages_server_id_unique` ON `pages` (`server_id`);