-- Public Want List - figures users want to collect
-- Allows collectors to share which figures they're looking for

-- Create priority enum (inline in MySQL)
-- 'low' = Nice to have, 'medium' = Want it, 'high' = Really want it

CREATE TABLE `figure_want_list` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supabase_user_id` varchar(64) NOT NULL,
	`doflin_id` int NOT NULL,
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`notes` varchar(200),
	`is_public` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `figure_want_list_id` PRIMARY KEY(`id`),
	CONSTRAINT `want_list_user_doflin_unique` UNIQUE(`supabase_user_id`,`doflin_id`)
);

-- Add indexes
CREATE INDEX `want_list_user_idx` ON `figure_want_list` (`supabase_user_id`);
CREATE INDEX `want_list_doflin_idx` ON `figure_want_list` (`doflin_id`);
CREATE INDEX `want_list_public_idx` ON `figure_want_list` (`is_public`);

-- Add foreign key
ALTER TABLE `figure_want_list` ADD CONSTRAINT `figure_want_list_doflin_id_doflins_id_fk` FOREIGN KEY (`doflin_id`) REFERENCES `doflins`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
