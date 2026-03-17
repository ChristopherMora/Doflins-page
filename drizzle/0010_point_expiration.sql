-- Migración 0010: Agregar campo expires_at a point_transactions
-- Los puntos positivos expiran 1 año después de ser otorgados.
-- Un valor NULL significa que no expiran (puntos de canjeo/débito o puntos legacy).

ALTER TABLE `point_transactions`
  ADD COLUMN `expires_at` timestamp NULL AFTER `meta`;

CREATE INDEX `point_tx_expires_idx` ON `point_transactions` (`expires_at`);
