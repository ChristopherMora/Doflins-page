ALTER TABLE `doflins` ADD `modelo_base` varchar(120) NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE `doflins` ADD `variante` varchar(120) NOT NULL DEFAULT 'Original';
--> statement-breakpoint
UPDATE `doflins` SET `modelo_base` = `nombre` WHERE `modelo_base` = '';
--> statement-breakpoint
UPDATE `doflins` SET `variante` = 'Original' WHERE `variante` = '';
--> statement-breakpoint
CREATE INDEX `doflins_modelo_base_idx` ON `doflins` (`modelo_base`);
