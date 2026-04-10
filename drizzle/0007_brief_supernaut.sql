CREATE TABLE `shop_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` varchar(64) NOT NULL,
	`shop_event_type` enum('shop_view','product_view','product_click','add_to_cart','remove_from_cart','cart_view','checkout_start','checkout_complete','search','filter','wishlist_add','wishlist_remove','quick_view_open','quick_view_close','promo_click','discount_apply') NOT NULL,
	`product_handle` varchar(120),
	`product_title` varchar(200),
	`variant_id` varchar(64),
	`universe` varchar(32),
	`price_cents` int,
	`quantity` int,
	`cart_total_cents` int,
	`cart_item_count` int,
	`search_query` varchar(120),
	`filter_value` varchar(80),
	`referrer` varchar(200),
	`ip_hash` varchar(64) NOT NULL,
	`user_agent` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shop_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `shop_events_session_idx` ON `shop_events` (`session_id`);--> statement-breakpoint
CREATE INDEX `shop_events_event_type_idx` ON `shop_events` (`shop_event_type`);--> statement-breakpoint
CREATE INDEX `shop_events_created_at_idx` ON `shop_events` (`created_at`);--> statement-breakpoint
CREATE INDEX `shop_events_product_handle_idx` ON `shop_events` (`product_handle`);