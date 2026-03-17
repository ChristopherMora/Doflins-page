-- Migration: sistema de puntos y tienda de recompensas
-- Aplicar con: npx drizzle-kit push  O  ejecutar manualmente en MySQL

CREATE TABLE `user_points` (
  `id` int AUTO_INCREMENT NOT NULL,
  `supabase_user_id` varchar(64) NOT NULL,
  `balance` int NOT NULL DEFAULT 0,
  `total_earned` int NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `user_points_id` PRIMARY KEY(`id`)
);
CREATE UNIQUE INDEX `user_points_user_unique` ON `user_points` (`supabase_user_id`);

--> statement-breakpoint

CREATE TABLE `point_transactions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `supabase_user_id` varchar(64) NOT NULL,
  `amount` int NOT NULL,
  `reason` enum('reveal_scan','rarity_bonus','purchase','referral_used','achievement','manual_award','redeem') NOT NULL,
  `meta` text,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `point_transactions_id` PRIMARY KEY(`id`)
);
CREATE INDEX `point_tx_user_idx` ON `point_transactions` (`supabase_user_id`);
CREATE INDEX `point_tx_created_idx` ON `point_transactions` (`created_at`);

--> statement-breakpoint

CREATE TABLE `rewards` (
  `id` int AUTO_INCREMENT NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` text,
  `image_url` varchar(512),
  `points_cost` int NOT NULL,
  `type` enum('discount_code','physical','digital','custom') NOT NULL DEFAULT 'custom',
  `stock` int,
  `active` boolean NOT NULL DEFAULT true,
  `meta` text,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `rewards_id` PRIMARY KEY(`id`)
);
CREATE INDEX `rewards_active_idx` ON `rewards` (`active`);

--> statement-breakpoint

CREATE TABLE `reward_redemptions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `supabase_user_id` varchar(64) NOT NULL,
  `reward_id` int NOT NULL,
  `points_spent` int NOT NULL,
  `status` enum('pending','processed','cancelled') NOT NULL DEFAULT 'pending',
  `delivery_data` text,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `reward_redemptions_id` PRIMARY KEY(`id`),
  CONSTRAINT `reward_redemptions_reward_fk` FOREIGN KEY (`reward_id`) REFERENCES `rewards`(`id`)
);
CREATE INDEX `redemptions_user_idx` ON `reward_redemptions` (`supabase_user_id`);
CREATE INDEX `redemptions_reward_idx` ON `reward_redemptions` (`reward_id`);
CREATE INDEX `redemptions_status_idx` ON `reward_redemptions` (`status`);
