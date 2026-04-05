-- Daily Figure & Streak System
-- Adds tables for daily featured figure, claims, and user streaks

-- Extend point_reason enum to include daily_claim and streak_bonus
ALTER TABLE `point_transactions` MODIFY COLUMN `reason` enum('reveal_scan','rarity_bonus','purchase','referral_used','achievement','manual_award','redeem','daily_claim','streak_bonus') NOT NULL;

-- Daily figures table - stores which figure is featured each day
CREATE TABLE `daily_figures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`doflin_id` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`points_reward` int NOT NULL DEFAULT 5,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `daily_figures_id` PRIMARY KEY(`id`),
	CONSTRAINT `daily_figures_date_unique` UNIQUE(`date`)
);

-- Daily claims table - tracks which users claimed points for each daily figure
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

-- User streaks table - tracks consecutive daily claims
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

-- Add indexes
CREATE INDEX `daily_figures_doflin_idx` ON `daily_figures` (`doflin_id`);
CREATE INDEX `daily_claims_user_idx` ON `daily_claims` (`supabase_user_id`);

-- Add foreign keys
ALTER TABLE `daily_figures` ADD CONSTRAINT `daily_figures_doflin_id_doflins_id_fk` FOREIGN KEY (`doflin_id`) REFERENCES `doflins`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE `daily_claims` ADD CONSTRAINT `daily_claims_daily_figure_id_daily_figures_id_fk` FOREIGN KEY (`daily_figure_id`) REFERENCES `daily_figures`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
