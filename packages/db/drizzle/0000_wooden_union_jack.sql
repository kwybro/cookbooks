CREATE TABLE `books` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`author` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `index_images` (
	`id` text PRIMARY KEY NOT NULL,
	`book_id` text NOT NULL,
	`r2_key` text NOT NULL,
	`last_processed_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `recipes` (
	`id` text PRIMARY KEY NOT NULL,
	`book_id` text NOT NULL,
	`name` text NOT NULL,
	`page_start` integer NOT NULL,
	`page_end` integer,
	`category` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE cascade
);
