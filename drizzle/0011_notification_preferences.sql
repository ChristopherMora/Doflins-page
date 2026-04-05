-- Notification preferences table
CREATE TABLE IF NOT EXISTS `notification_preferences` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `supabase_user_id` VARCHAR(64) NOT NULL,
  `email_new_figure` BOOLEAN NOT NULL DEFAULT true,
  `email_weekly_digest` BOOLEAN NOT NULL DEFAULT true,
  `email_reward_available` BOOLEAN NOT NULL DEFAULT true,
  `email_trade_request` BOOLEAN NOT NULL DEFAULT true,
  `push_enabled` BOOLEAN NOT NULL DEFAULT false,
  `push_subscription` TEXT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

-- Index for user lookup
CREATE UNIQUE INDEX `notif_prefs_user_unique` ON `notification_preferences` (`supabase_user_id`);
