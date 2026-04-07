CREATE TABLE `daily_claims` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supabase_user_id` varchar(64) NOT NULL,
	`daily_figure_id` int NOT NULL,
	`points_awarded` int NOT NULL,
	`streak_bonus` int NOT NULL DEFAULT 0,
	`claimed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `daily_claims_id` PRIMARY KEY(`id`),
	CONSTRAINT `daily_claims_user_figure_unique` UNIQUE(`supabase_user_id`,`daily_figure_id`)
);
--> statement-breakpoint
CREATE TABLE `daily_figures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`doflin_id` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`points_reward` int NOT NULL DEFAULT 5,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `daily_figures_id` PRIMARY KEY(`id`),
	CONSTRAINT `daily_figures_date_unique` UNIQUE(`date`)
);
--> statement-breakpoint
CREATE TABLE `figure_want_list` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supabase_user_id` varchar(64) NOT NULL,
	`doflin_id` int NOT NULL,
	`want_list_priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`notes` varchar(200),
	`is_public` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `figure_want_list_id` PRIMARY KEY(`id`),
	CONSTRAINT `want_list_user_doflin_unique` UNIQUE(`supabase_user_id`,`doflin_id`)
);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supabase_user_id` varchar(64) NOT NULL,
	`email_new_figure` boolean NOT NULL DEFAULT true,
	`email_weekly_digest` boolean NOT NULL DEFAULT true,
	`email_reward_available` boolean NOT NULL DEFAULT true,
	`email_trade_request` boolean NOT NULL DEFAULT true,
	`push_enabled` boolean NOT NULL DEFAULT false,
	`push_subscription` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `notif_prefs_user_unique` UNIQUE(`supabase_user_id`)
);
--> statement-breakpoint
CREATE TABLE `point_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supabase_user_id` varchar(64) NOT NULL,
	`amount` int NOT NULL,
	`point_reason` enum('reveal_scan','rarity_bonus','purchase','referral_used','achievement','manual_award','redeem','daily_claim','streak_bonus') NOT NULL,
	`meta` text,
	`expires_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `point_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referral_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supabase_user_id` varchar(64) NOT NULL,
	`code` varchar(20) NOT NULL,
	`discount_percent` int NOT NULL DEFAULT 10,
	`shopify_price_rule_id` varchar(64),
	`shopify_discount_code_id` varchar(64),
	`uses_count` int NOT NULL DEFAULT 0,
	`max_uses` int,
	`active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referral_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `referral_codes_code_unique` UNIQUE(`code`),
	CONSTRAINT `referral_codes_user_unique` UNIQUE(`supabase_user_id`)
);
--> statement-breakpoint
CREATE TABLE `referral_uses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referral_code_id` int NOT NULL,
	`used_by_email` varchar(190),
	`shopify_order_id` varchar(64),
	`discount_applied` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referral_uses_id` PRIMARY KEY(`id`),
	CONSTRAINT `referral_uses_code_email_unique` UNIQUE(`referral_code_id`,`used_by_email`)
);
--> statement-breakpoint
CREATE TABLE `reward_redemptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supabase_user_id` varchar(64) NOT NULL,
	`reward_id` int NOT NULL,
	`points_spent` int NOT NULL,
	`redemption_status` enum('pending','processed','cancelled') NOT NULL DEFAULT 'pending',
	`delivery_data` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reward_redemptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rewards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(100) NOT NULL,
	`description` text,
	`image_url` varchar(512),
	`points_cost` int NOT NULL,
	`reward_type` enum('discount_code','physical','digital','custom') NOT NULL DEFAULT 'custom',
	`stock` int,
	`active` boolean NOT NULL DEFAULT true,
	`meta` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rewards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trade_listings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supabase_user_id` varchar(64) NOT NULL,
	`offering_doflin_id` int NOT NULL,
	`wanting_doflin_id` int,
	`rareza` enum('COMMON','RARE','EPIC','LEGENDARY','ULTRA','MYTHIC') NOT NULL,
	`notes` text,
	`trade_status` enum('open','pending','completed','cancelled') NOT NULL DEFAULT 'open',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trade_listings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trade_offers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listing_id` int NOT NULL,
	`offerer_user_id` varchar(64) NOT NULL,
	`offered_doflin_id` int NOT NULL,
	`message` text,
	`trade_offer_status` enum('pending','accepted','rejected','withdrawn') NOT NULL DEFAULT 'pending',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trade_offers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_collection_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supabase_user_id` varchar(64) NOT NULL,
	`user_email` varchar(190) NOT NULL,
	`doflin_id` int NOT NULL,
	`owned` boolean NOT NULL DEFAULT true,
	`quantity` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_collection_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_collection_progress_user_doflin_unique` UNIQUE(`supabase_user_id`,`doflin_id`)
);
--> statement-breakpoint
CREATE TABLE `user_points` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supabase_user_id` varchar(64) NOT NULL,
	`balance` int NOT NULL DEFAULT 0,
	`total_earned` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_points_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_points_user_unique` UNIQUE(`supabase_user_id`)
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supabase_user_id` varchar(64) NOT NULL,
	`display_name` varchar(50) NOT NULL,
	`current_streak` int NOT NULL DEFAULT 0,
	`longest_streak` int NOT NULL DEFAULT 0,
	`last_reveal_date` varchar(10),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_profiles_user_unique` UNIQUE(`supabase_user_id`)
);
--> statement-breakpoint
CREATE TABLE `user_streaks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supabase_user_id` varchar(64) NOT NULL,
	`current_streak` int NOT NULL DEFAULT 0,
	`longest_streak` int NOT NULL DEFAULT 0,
	`last_claim_date` varchar(10),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_streaks_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_streaks_user_unique` UNIQUE(`supabase_user_id`)
);
--> statement-breakpoint
CREATE TABLE `wishlist_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supabase_user_id` varchar(64) NOT NULL,
	`shopify_product_id` varchar(64) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wishlist_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `wishlist_user_product_unique` UNIQUE(`supabase_user_id`,`shopify_product_id`)
);
--> statement-breakpoint
ALTER TABLE `codigos_bolsa_items` DROP FOREIGN KEY `codigos_bolsa_items_codigo_bolsa_id_codigos_bolsa_id_fk`;
--> statement-breakpoint
ALTER TABLE `codigos_bolsa_items` DROP FOREIGN KEY `codigos_bolsa_items_doflin_id_doflins_id_fk`;
--> statement-breakpoint
ALTER TABLE `scan_events` DROP FOREIGN KEY `scan_events_codigo_bolsa_id_codigos_bolsa_id_fk`;
--> statement-breakpoint
ALTER TABLE `doflins` ADD `modelo_base` varchar(120) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `doflins` ADD `variante` varchar(120) DEFAULT 'Original' NOT NULL;--> statement-breakpoint
ALTER TABLE `doflins` ADD `dato_curioso` text;--> statement-breakpoint
ALTER TABLE `daily_claims` ADD CONSTRAINT `daily_claims_daily_figure_id_daily_figures_id_fk` FOREIGN KEY (`daily_figure_id`) REFERENCES `daily_figures`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `daily_figures` ADD CONSTRAINT `daily_figures_doflin_id_doflins_id_fk` FOREIGN KEY (`doflin_id`) REFERENCES `doflins`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `figure_want_list` ADD CONSTRAINT `figure_want_list_doflin_id_doflins_id_fk` FOREIGN KEY (`doflin_id`) REFERENCES `doflins`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `referral_uses` ADD CONSTRAINT `referral_uses_referral_code_id_referral_codes_id_fk` FOREIGN KEY (`referral_code_id`) REFERENCES `referral_codes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reward_redemptions` ADD CONSTRAINT `reward_redemptions_reward_id_rewards_id_fk` FOREIGN KEY (`reward_id`) REFERENCES `rewards`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trade_listings` ADD CONSTRAINT `trade_listings_offering_doflin_id_doflins_id_fk` FOREIGN KEY (`offering_doflin_id`) REFERENCES `doflins`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trade_listings` ADD CONSTRAINT `trade_listings_wanting_doflin_id_doflins_id_fk` FOREIGN KEY (`wanting_doflin_id`) REFERENCES `doflins`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trade_offers` ADD CONSTRAINT `trade_offers_listing_id_trade_listings_id_fk` FOREIGN KEY (`listing_id`) REFERENCES `trade_listings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trade_offers` ADD CONSTRAINT `trade_offers_offered_doflin_id_doflins_id_fk` FOREIGN KEY (`offered_doflin_id`) REFERENCES `doflins`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_collection_progress` ADD CONSTRAINT `user_collection_progress_doflin_id_doflins_id_fk` FOREIGN KEY (`doflin_id`) REFERENCES `doflins`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `daily_claims_user_idx` ON `daily_claims` (`supabase_user_id`);--> statement-breakpoint
CREATE INDEX `daily_figures_doflin_idx` ON `daily_figures` (`doflin_id`);--> statement-breakpoint
CREATE INDEX `want_list_user_idx` ON `figure_want_list` (`supabase_user_id`);--> statement-breakpoint
CREATE INDEX `want_list_doflin_idx` ON `figure_want_list` (`doflin_id`);--> statement-breakpoint
CREATE INDEX `want_list_public_idx` ON `figure_want_list` (`is_public`);--> statement-breakpoint
CREATE INDEX `point_tx_user_idx` ON `point_transactions` (`supabase_user_id`);--> statement-breakpoint
CREATE INDEX `point_tx_created_idx` ON `point_transactions` (`created_at`);--> statement-breakpoint
CREATE INDEX `referral_codes_active_idx` ON `referral_codes` (`active`);--> statement-breakpoint
CREATE INDEX `referral_uses_code_idx` ON `referral_uses` (`referral_code_id`);--> statement-breakpoint
CREATE INDEX `referral_uses_email_idx` ON `referral_uses` (`used_by_email`);--> statement-breakpoint
CREATE INDEX `redemptions_user_idx` ON `reward_redemptions` (`supabase_user_id`);--> statement-breakpoint
CREATE INDEX `redemptions_reward_idx` ON `reward_redemptions` (`reward_id`);--> statement-breakpoint
CREATE INDEX `redemptions_status_idx` ON `reward_redemptions` (`redemption_status`);--> statement-breakpoint
CREATE INDEX `rewards_active_idx` ON `rewards` (`active`);--> statement-breakpoint
CREATE INDEX `trade_listings_user_idx` ON `trade_listings` (`supabase_user_id`);--> statement-breakpoint
CREATE INDEX `trade_listings_status_idx` ON `trade_listings` (`trade_status`);--> statement-breakpoint
CREATE INDEX `trade_listings_offering_idx` ON `trade_listings` (`offering_doflin_id`);--> statement-breakpoint
CREATE INDEX `trade_listings_wanting_idx` ON `trade_listings` (`wanting_doflin_id`);--> statement-breakpoint
CREATE INDEX `trade_offers_listing_idx` ON `trade_offers` (`listing_id`);--> statement-breakpoint
CREATE INDEX `trade_offers_offerer_idx` ON `trade_offers` (`offerer_user_id`);--> statement-breakpoint
CREATE INDEX `trade_offers_status_idx` ON `trade_offers` (`trade_offer_status`);--> statement-breakpoint
CREATE INDEX `user_collection_progress_user_idx` ON `user_collection_progress` (`supabase_user_id`);--> statement-breakpoint
CREATE INDEX `user_collection_progress_doflin_idx` ON `user_collection_progress` (`doflin_id`);--> statement-breakpoint
CREATE INDEX `wishlist_user_idx` ON `wishlist_items` (`supabase_user_id`);--> statement-breakpoint
ALTER TABLE `codigos_bolsa_items` ADD CONSTRAINT `codigos_bolsa_items_codigo_bolsa_id_codigos_bolsa_id_fk` FOREIGN KEY (`codigo_bolsa_id`) REFERENCES `codigos_bolsa`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `codigos_bolsa_items` ADD CONSTRAINT `codigos_bolsa_items_doflin_id_doflins_id_fk` FOREIGN KEY (`doflin_id`) REFERENCES `doflins`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scan_events` ADD CONSTRAINT `scan_events_codigo_bolsa_id_codigos_bolsa_id_fk` FOREIGN KEY (`codigo_bolsa_id`) REFERENCES `codigos_bolsa`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `codigos_bolsa_doflin_idx` ON `codigos_bolsa` (`doflin_id`);--> statement-breakpoint
CREATE INDEX `doflins_modelo_base_idx` ON `doflins` (`modelo_base`);