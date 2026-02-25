CREATE TABLE `codigos_bolsa_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigo_bolsa_id` int NOT NULL,
	`doflin_id` int NOT NULL,
	`posicion` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `codigos_bolsa_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `codigos_bolsa_items_code_position_unique` UNIQUE(`codigo_bolsa_id`,`posicion`)
);
--> statement-breakpoint
ALTER TABLE `codigos_bolsa` ADD `pack_size` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `codigos_bolsa_items` ADD CONSTRAINT `codigos_bolsa_items_codigo_bolsa_id_codigos_bolsa_id_fk` FOREIGN KEY (`codigo_bolsa_id`) REFERENCES `codigos_bolsa`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `codigos_bolsa_items` ADD CONSTRAINT `codigos_bolsa_items_doflin_id_doflins_id_fk` FOREIGN KEY (`doflin_id`) REFERENCES `doflins`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
INSERT INTO `codigos_bolsa_items` (`codigo_bolsa_id`, `doflin_id`, `posicion`)
SELECT cb.`id`, cb.`doflin_id`, 1
FROM `codigos_bolsa` cb
LEFT JOIN `codigos_bolsa_items` cbi
  ON cbi.`codigo_bolsa_id` = cb.`id` AND cbi.`posicion` = 1
WHERE cbi.`id` IS NULL;--> statement-breakpoint
CREATE INDEX `codigos_bolsa_items_code_idx` ON `codigos_bolsa_items` (`codigo_bolsa_id`);--> statement-breakpoint
CREATE INDEX `codigos_bolsa_items_doflin_idx` ON `codigos_bolsa_items` (`doflin_id`);--> statement-breakpoint
CREATE INDEX `codigos_bolsa_pack_size_idx` ON `codigos_bolsa` (`pack_size`);
