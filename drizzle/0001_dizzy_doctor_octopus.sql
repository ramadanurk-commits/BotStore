CREATE TABLE `installations` (
	`order_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`config` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`ticket_id` text NOT NULL,
	`author_id` text NOT NULL,
	`is_admin` integer NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_messages_ticket` ON `messages` (`ticket_id`);--> statement-breakpoint
CREATE TABLE `payments` (
	`order_id` text PRIMARY KEY NOT NULL,
	`payment_id` text,
	`redirect_url` text,
	`status` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payouts` (
	`id` text PRIMARY KEY NOT NULL,
	`seller_id` text NOT NULL,
	`amount` integer NOT NULL,
	`reference` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_payouts_seller` ON `payouts` (`seller_id`);--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`product_id` text NOT NULL,
	`rating` integer NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_reviews_user_product` ON `reviews` (`user_id`,`product_id`);--> statement-breakpoint
CREATE INDEX `idx_reviews_product` ON `reviews` (`product_id`);--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`order_id` text NOT NULL,
	`subject` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_tickets_user` ON `tickets` (`user_id`);--> statement-breakpoint
ALTER TABLE `orders` ADD `fee` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
INSERT OR IGNORE INTO products (id,owner_id,category,price,content,status,file_key,filename,created_at,updated_at) SELECT 'sto-booking',owner_id,'telegram',10000,'{"kk":{"name":"СТО-ға жазылу боты","description":"Қызметті, күнді және бос уақытты таңдау арқылы клиенттерді жазыңыз.","features":"Бос слоттар және қайталанбайтын жазылу\nКлиенттің өз жазылуын тоқтатуы\nӘкімшіге хабарлама\nОрнату шебері","requirements":"Python 3.10+, Telegram токені және үнемі жұмыс істейтін компьютер/сервер. Бір слотқа бір көлік; UTC+5. Хостинг пен төлем қабылдау кірмейді."},"ru":{"name":"Бот записи для СТО","description":"Клиент выбирает услугу, день и свободное время. Записи сохраняются в SQLite.","features":"Защита от двойной записи\nОтмена записи клиентом\nУведомления администратору\nМастер установки","requirements":"Python 3.10+, токен Telegram и постоянно работающий компьютер/сервер. Одна машина на слот; UTC+5. Хостинг и платежи не включены."},"en":{"name":"Auto service booking bot","description":"Customers choose a service, date and available time. Bookings are saved in SQLite.","features":"Double-booking protection\nCustomer cancellations\nAdministrator notifications\nSetup wizard","requirements":"Python 3.10+, Telegram token and an always-running computer/server. One vehicle per slot; UTC+5. Hosting and payments are not included."}}','published','builtin:sto-booking','sto-booking.zip',unixepoch()*1000,unixepoch()*1000 FROM products WHERE id='telegram-orders';
