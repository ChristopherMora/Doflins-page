ALTER TABLE `shop_events` MODIFY COLUMN `shop_event_type` enum('shop_view','product_view','product_click','add_to_cart','remove_from_cart','cart_view','checkout_start','checkout_complete','search','filter','wishlist_add','wishlist_remove','quick_view_open','quick_view_close','promo_click','discount_apply','scroll_depth','web_vital','page_exit') NOT NULL;--> statement-breakpoint
ALTER TABLE `shop_events` ADD `visitor_id` varchar(64);--> statement-breakpoint
ALTER TABLE `shop_events` ADD `visit_number` int;--> statement-breakpoint
ALTER TABLE `shop_events` ADD `utm_source` varchar(80);--> statement-breakpoint
ALTER TABLE `shop_events` ADD `utm_medium` varchar(80);--> statement-breakpoint
ALTER TABLE `shop_events` ADD `utm_campaign` varchar(120);--> statement-breakpoint
ALTER TABLE `shop_events` ADD `device_type` enum('mobile','tablet','desktop');--> statement-breakpoint
ALTER TABLE `shop_events` ADD `viewport_width` int;--> statement-breakpoint
ALTER TABLE `shop_events` ADD `scroll_percent` int;--> statement-breakpoint
ALTER TABLE `shop_events` ADD `duration_ms` int;--> statement-breakpoint
ALTER TABLE `shop_events` ADD `metric_name` varchar(40);--> statement-breakpoint
ALTER TABLE `shop_events` ADD `metric_value` varchar(20);--> statement-breakpoint
CREATE INDEX `shop_events_visitor_idx` ON `shop_events` (`visitor_id`);