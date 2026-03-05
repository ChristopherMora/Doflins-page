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

CREATE TABLE `referral_uses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referral_code_id` int NOT NULL,
	`used_by_email` varchar(190),
	`shopify_order_id` varchar(64),
	`discount_applied` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referral_uses_id` PRIMARY KEY(`id`)
);

CREATE INDEX `referral_codes_active_idx` ON `referral_codes` (`active`);
CREATE INDEX `referral_uses_code_idx` ON `referral_uses` (`referral_code_id`);
CREATE INDEX `referral_uses_email_idx` ON `referral_uses` (`used_by_email`);

ALTER TABLE `referral_uses` ADD CONSTRAINT `referral_uses_referral_code_id_referral_codes_id_fk`
  FOREIGN KEY (`referral_code_id`) REFERENCES `referral_codes`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
