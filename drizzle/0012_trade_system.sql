-- Trade system tables

-- Trade status enum
-- Note: MySQL doesn't support adding enum values to existing tables easily,
-- so we define the enum inline in the column definition

-- Trade listings table
CREATE TABLE IF NOT EXISTS `trade_listings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `supabase_user_id` VARCHAR(64) NOT NULL,
  `offering_doflin_id` INT NOT NULL,
  `wanting_doflin_id` INT,
  `wanting_rarity` ENUM('COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'ULTRA', 'MYTHIC'),
  `notes` TEXT,
  `status` ENUM('open', 'pending', 'completed', 'cancelled') NOT NULL DEFAULT 'open',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `trade_listings_offering_fk` FOREIGN KEY (`offering_doflin_id`) REFERENCES `doflins` (`id`),
  CONSTRAINT `trade_listings_wanting_fk` FOREIGN KEY (`wanting_doflin_id`) REFERENCES `doflins` (`id`)
);

CREATE INDEX `trade_listings_user_idx` ON `trade_listings` (`supabase_user_id`);
CREATE INDEX `trade_listings_status_idx` ON `trade_listings` (`status`);
CREATE INDEX `trade_listings_offering_idx` ON `trade_listings` (`offering_doflin_id`);
CREATE INDEX `trade_listings_wanting_idx` ON `trade_listings` (`wanting_doflin_id`);

-- Trade offers table
CREATE TABLE IF NOT EXISTS `trade_offers` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `listing_id` INT NOT NULL,
  `offerer_user_id` VARCHAR(64) NOT NULL,
  `offered_doflin_id` INT NOT NULL,
  `message` TEXT,
  `status` ENUM('pending', 'accepted', 'rejected', 'withdrawn') NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `trade_offers_listing_fk` FOREIGN KEY (`listing_id`) REFERENCES `trade_listings` (`id`),
  CONSTRAINT `trade_offers_offered_fk` FOREIGN KEY (`offered_doflin_id`) REFERENCES `doflins` (`id`)
);

CREATE INDEX `trade_offers_listing_idx` ON `trade_offers` (`listing_id`);
CREATE INDEX `trade_offers_offerer_idx` ON `trade_offers` (`offerer_user_id`);
CREATE INDEX `trade_offers_status_idx` ON `trade_offers` (`status`);
