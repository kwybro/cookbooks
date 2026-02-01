ALTER TABLE `index_images` ADD `status` text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `index_images` ADD `error_message` text;