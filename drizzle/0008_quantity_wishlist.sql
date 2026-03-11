-- Migration: add quantity column to user_collection_progress + create wishlist_items table
-- Apply with: npx drizzle-kit push  OR  run manually on MySQL

ALTER TABLE `user_collection_progress`
  ADD COLUMN `quantity` int NOT NULL DEFAULT 1;

CREATE TABLE `wishlist_items` (
  `id` int AUTO_INCREMENT NOT NULL,
  `supabase_user_id` varchar(64) NOT NULL,
  `shopify_product_id` varchar(64) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `wishlist_items_id_pk` PRIMARY KEY(`id`)
);

CREATE UNIQUE INDEX `wishlist_user_product_unique` ON `wishlist_items` (`supabase_user_id`, `shopify_product_id`);
CREATE INDEX `wishlist_user_idx` ON `wishlist_items` (`supabase_user_id`);
