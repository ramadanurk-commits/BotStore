ALTER TABLE `products` ADD `demo_url` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_orders_created` ON `orders` (`created_at`);