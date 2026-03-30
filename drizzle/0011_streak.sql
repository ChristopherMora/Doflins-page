-- Agrega campos de racha de reveals al perfil de usuario
ALTER TABLE `user_profiles`
  ADD COLUMN `current_streak` int NOT NULL DEFAULT 0,
  ADD COLUMN `longest_streak` int NOT NULL DEFAULT 0,
  ADD COLUMN `last_reveal_date` varchar(10);
