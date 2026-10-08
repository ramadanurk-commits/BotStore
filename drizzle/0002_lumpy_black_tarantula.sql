CREATE TABLE `catalog_events` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`kind` text NOT NULL,
	`session` text NOT NULL,
	`day` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_events_unique` ON `catalog_events` (`product_id`,`kind`,`session`,`day`);--> statement-breakpoint
CREATE INDEX `idx_events_created` ON `catalog_events` (`created_at`);--> statement-breakpoint
CREATE TABLE `request_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_limits_expiry` ON `request_limits` (`expires_at`);--> statement-breakpoint
CREATE TABLE `service_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`product_id` text,
	`tier` text NOT NULL,
	`sector` text NOT NULL,
	`language` text NOT NULL,
	`name` text NOT NULL,
	`contact` text NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`quote` integer,
	`deadline` text DEFAULT '' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_requests_status_created` ON `service_requests` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_requests_user_created` ON `service_requests` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_requests_created` ON `service_requests` (`created_at`);