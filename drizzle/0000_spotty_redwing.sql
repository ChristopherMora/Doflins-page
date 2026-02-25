CREATE TABLE `codigos_bolsa` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigo` varchar(12) NOT NULL,
	`doflin_id` int NOT NULL,
	`usado` boolean NOT NULL DEFAULT false,
	`fecha_activacion` timestamp,
	`scan_count` int NOT NULL DEFAULT 0,
	`last_scanned_at` timestamp,
	`status` enum('active','blocked') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `codigos_bolsa_id` PRIMARY KEY(`id`),
	CONSTRAINT `codigos_bolsa_codigo_unique` UNIQUE(`codigo`)
);
--> statement-breakpoint
CREATE TABLE `doflins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(120) NOT NULL,
	`slug` varchar(140) NOT NULL,
	`serie` varchar(64) NOT NULL,
	`numero_coleccion` int NOT NULL,
	`rareza` enum('COMMON','RARE','EPIC','LEGENDARY','ULTRA','MYTHIC') NOT NULL,
	`probabilidad` int NOT NULL,
	`imagen_url` varchar(512) NOT NULL,
	`silueta_url` varchar(512) NOT NULL,
	`activo` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `doflins_id` PRIMARY KEY(`id`),
	CONSTRAINT `doflins_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `scan_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigo_input` varchar(32) NOT NULL,
	`codigo_bolsa_id` int,
	`event_type` enum('scan','invalid','reveal_success','purchase_intent','rate_limited') NOT NULL,
	`ip_hash` varchar(64) NOT NULL,
	`user_agent` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scan_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `codigos_bolsa` ADD CONSTRAINT `codigos_bolsa_doflin_id_doflins_id_fk` FOREIGN KEY (`doflin_id`) REFERENCES `doflins`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scan_events` ADD CONSTRAINT `scan_events_codigo_bolsa_id_codigos_bolsa_id_fk` FOREIGN KEY (`codigo_bolsa_id`) REFERENCES `codigos_bolsa`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `codigos_bolsa_usado_idx` ON `codigos_bolsa` (`usado`);--> statement-breakpoint
CREATE INDEX `doflins_rareza_idx` ON `doflins` (`rareza`);--> statement-breakpoint
CREATE INDEX `scan_events_created_at_idx` ON `scan_events` (`created_at`);--> statement-breakpoint
CREATE INDEX `scan_events_event_type_idx` ON `scan_events` (`event_type`);