CREATE TABLE `user_collection_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supabase_user_id` varchar(64) NOT NULL,
	`user_email` varchar(190) NOT NULL,
	`doflin_id` int NOT NULL,
	`owned` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_collection_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `user_collection_progress` ADD CONSTRAINT `user_collection_progress_doflin_id_doflins_id_fk` FOREIGN KEY (`doflin_id`) REFERENCES `doflins`(`id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX `user_collection_progress_user_doflin_unique` ON `user_collection_progress` (`supabase_user_id`,`doflin_id`);
--> statement-breakpoint
CREATE INDEX `user_collection_progress_user_idx` ON `user_collection_progress` (`supabase_user_id`);
--> statement-breakpoint
CREATE INDEX `user_collection_progress_doflin_idx` ON `user_collection_progress` (`doflin_id`);
