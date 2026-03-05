CREATE TABLE `user_profiles` (
  `id` int AUTO_INCREMENT NOT NULL,
  `supabase_user_id` varchar(64) NOT NULL,
  `display_name` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT now(),
  `updated_at` timestamp NOT NULL DEFAULT now() ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `user_profiles_pk` PRIMARY KEY(`id`),
  CONSTRAINT `user_profiles_user_unique` UNIQUE(`supabase_user_id`)
);
