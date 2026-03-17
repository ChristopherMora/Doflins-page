import {
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const rarityEnum = mysqlEnum("rareza", [
  "COMMON",
  "RARE",
  "EPIC",
  "LEGENDARY",
  "ULTRA",
  "MYTHIC",
]);

export const bagCodeStatusEnum = mysqlEnum("status", ["active", "blocked"]);

export const scanEventTypeEnum = mysqlEnum("event_type", [
  "scan",
  "invalid",
  "reveal_success",
  "purchase_intent",
  "rate_limited",
  "universe_switch",
  "filter_apply",
  "card_open",
  "view_3d",
]);

export const doflins = mysqlTable(
  "doflins",
  {
    id: int("id").autoincrement().primaryKey(),
    nombre: varchar("nombre", { length: 120 }).notNull(),
    modeloBase: varchar("modelo_base", { length: 120 }).notNull().default(""),
    variante: varchar("variante", { length: 120 }).notNull().default("Original"),
    slug: varchar("slug", { length: 140 }).notNull(),
    serie: varchar("serie", { length: 64 }).notNull(),
    numeroColeccion: int("numero_coleccion").notNull(),
    rareza: rarityEnum.notNull(),
    probabilidad: int("probabilidad").notNull(),
    imagenUrl: varchar("imagen_url", { length: 512 }).notNull(),
    siluetaUrl: varchar("silueta_url", { length: 512 }).notNull(),
    activo: boolean("activo").notNull().default(true),
    datoCurioso: text("dato_curioso"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .onUpdateNow(),
  },
  (table) => [
    uniqueIndex("doflins_slug_unique").on(table.slug),
    index("doflins_rareza_idx").on(table.rareza),
    index("doflins_modelo_base_idx").on(table.modeloBase),
  ],
);

export const codigosBolsa = mysqlTable(
  "codigos_bolsa",
  {
    id: int("id").autoincrement().primaryKey(),
    codigo: varchar("codigo", { length: 12 }).notNull(),
    packSize: int("pack_size").notNull().default(1),
    doflinId: int("doflin_id")
      .notNull()
      .references(() => doflins.id),
    usado: boolean("usado").notNull().default(false),
    fechaActivacion: timestamp("fecha_activacion", { mode: "date" }),
    scanCount: int("scan_count").notNull().default(0),
    lastScannedAt: timestamp("last_scanned_at", { mode: "date" }),
    status: bagCodeStatusEnum.notNull().default("active"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .onUpdateNow(),
  },
  (table) => [
    uniqueIndex("codigos_bolsa_codigo_unique").on(table.codigo),
    index("codigos_bolsa_usado_idx").on(table.usado),
    index("codigos_bolsa_pack_size_idx").on(table.packSize),
  ],
);

export const codigosBolsaItems = mysqlTable(
  "codigos_bolsa_items",
  {
    id: int("id").autoincrement().primaryKey(),
    codigoBolsaId: int("codigo_bolsa_id")
      .notNull()
      .references(() => codigosBolsa.id),
    doflinId: int("doflin_id")
      .notNull()
      .references(() => doflins.id),
    posicion: int("posicion").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("codigos_bolsa_items_code_position_unique").on(table.codigoBolsaId, table.posicion),
    index("codigos_bolsa_items_code_idx").on(table.codigoBolsaId),
    index("codigos_bolsa_items_doflin_idx").on(table.doflinId),
  ],
);

export const scanEvents = mysqlTable(
  "scan_events",
  {
    id: int("id").autoincrement().primaryKey(),
    codigoInput: varchar("codigo_input", { length: 32 }).notNull(),
    codigoBolsaId: int("codigo_bolsa_id").references(() => codigosBolsa.id),
    eventType: scanEventTypeEnum.notNull(),
    ipHash: varchar("ip_hash", { length: 64 }).notNull(),
    userAgent: varchar("user_agent", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("scan_events_created_at_idx").on(table.createdAt),
    index("scan_events_event_type_idx").on(table.eventType),
  ],
);

export const userProfiles = mysqlTable(
  "user_profiles",
  {
    id: int("id").autoincrement().primaryKey(),
    supabaseUserId: varchar("supabase_user_id", { length: 64 }).notNull(),
    displayName: varchar("display_name", { length: 50 }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .onUpdateNow(),
  },
  (table) => [
    uniqueIndex("user_profiles_user_unique").on(table.supabaseUserId),
  ],
);

export const referralCodes = mysqlTable(
  "referral_codes",
  {
    id: int("id").autoincrement().primaryKey(),
    supabaseUserId: varchar("supabase_user_id", { length: 64 }).notNull(),
    code: varchar("code", { length: 20 }).notNull(),
    discountPercent: int("discount_percent").notNull().default(10),
    shopifyPriceRuleId: varchar("shopify_price_rule_id", { length: 64 }),
    shopifyDiscountCodeId: varchar("shopify_discount_code_id", { length: 64 }),
    usesCount: int("uses_count").notNull().default(0),
    maxUses: int("max_uses"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .onUpdateNow(),
  },
  (table) => [
    uniqueIndex("referral_codes_code_unique").on(table.code),
    uniqueIndex("referral_codes_user_unique").on(table.supabaseUserId),
    index("referral_codes_active_idx").on(table.active),
  ],
);

export const referralUses = mysqlTable(
  "referral_uses",
  {
    id: int("id").autoincrement().primaryKey(),
    referralCodeId: int("referral_code_id")
      .notNull()
      .references(() => referralCodes.id),
    usedByEmail: varchar("used_by_email", { length: 190 }),
    shopifyOrderId: varchar("shopify_order_id", { length: 64 }),
    discountApplied: int("discount_applied").notNull().default(0),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("referral_uses_code_idx").on(table.referralCodeId),
    index("referral_uses_email_idx").on(table.usedByEmail),
  ],
);

export const userCollectionProgress = mysqlTable(
  "user_collection_progress",
  {
    id: int("id").autoincrement().primaryKey(),
    supabaseUserId: varchar("supabase_user_id", { length: 64 }).notNull(),
    userEmail: varchar("user_email", { length: 190 }).notNull(),
    doflinId: int("doflin_id")
      .notNull()
      .references(() => doflins.id),
    owned: boolean("owned").notNull().default(true),
    quantity: int("quantity").notNull().default(1),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .onUpdateNow(),
  },
  (table) => [
    uniqueIndex("user_collection_progress_user_doflin_unique").on(table.supabaseUserId, table.doflinId),
    index("user_collection_progress_user_idx").on(table.supabaseUserId),
    index("user_collection_progress_doflin_idx").on(table.doflinId),
  ],
);

export const wishlistItems = mysqlTable(
  "wishlist_items",
  {
    id: int("id").autoincrement().primaryKey(),
    supabaseUserId: varchar("supabase_user_id", { length: 64 }).notNull(),
    shopifyProductId: varchar("shopify_product_id", { length: 64 }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("wishlist_user_product_unique").on(table.supabaseUserId, table.shopifyProductId),
    index("wishlist_user_idx").on(table.supabaseUserId),
  ],
);

// ─── Sistema de puntos y recompensas ──────────────────────────────────────────

export const pointReasonEnum = mysqlEnum("point_reason", [
  "reveal_scan",   // reveló una bolsa
  "rarity_bonus",  // bonus según rareza de la figura
  "purchase",      // compra en tienda Shopify
  "referral_used", // alguien usó tu código de referido
  "achievement",   // logro desbloqueado
  "manual_award",  // otorgado manualmente por el admin
  "redeem",        // canjear recompensa (valor negativo)
]);

export const rewardTypeEnum = mysqlEnum("reward_type", [
  "discount_code", // genera cupón Shopify
  "physical",      // producto físico (entrega manual)
  "digital",       // entrega digital (URL, código, imagen)
  "custom",        // acción personalizada
]);

export const redemptionStatusEnum = mysqlEnum("redemption_status", [
  "pending",    // esperando procesamiento del admin
  "processed",  // entregado al usuario
  "cancelled",  // cancelado, puntos revertidos
]);

export const userPoints = mysqlTable(
  "user_points",
  {
    id: int("id").autoincrement().primaryKey(),
    supabaseUserId: varchar("supabase_user_id", { length: 64 }).notNull(),
    balance: int("balance").notNull().default(0),
    totalEarned: int("total_earned").notNull().default(0),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .onUpdateNow(),
  },
  (table) => [
    uniqueIndex("user_points_user_unique").on(table.supabaseUserId),
  ],
);

export const pointTransactions = mysqlTable(
  "point_transactions",
  {
    id: int("id").autoincrement().primaryKey(),
    supabaseUserId: varchar("supabase_user_id", { length: 64 }).notNull(),
    amount: int("amount").notNull(),
    reason: pointReasonEnum.notNull(),
    meta: text("meta"), // JSON con detalles extra
    expiresAt: timestamp("expires_at", { mode: "date" }), // null = no expira
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("point_tx_user_idx").on(table.supabaseUserId),
    index("point_tx_created_idx").on(table.createdAt),
  ],
);

export const rewards = mysqlTable(
  "rewards",
  {
    id: int("id").autoincrement().primaryKey(),
    title: varchar("title", { length: 100 }).notNull(),
    description: text("description"),
    imageUrl: varchar("image_url", { length: 512 }),
    pointsCost: int("points_cost").notNull(),
    type: rewardTypeEnum.notNull().default("custom"),
    stock: int("stock"), // null = ilimitado
    active: boolean("active").notNull().default(true),
    meta: text("meta"), // JSON con config específica del tipo
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .onUpdateNow(),
  },
  (table) => [
    index("rewards_active_idx").on(table.active),
  ],
);

export const rewardRedemptions = mysqlTable(
  "reward_redemptions",
  {
    id: int("id").autoincrement().primaryKey(),
    supabaseUserId: varchar("supabase_user_id", { length: 64 }).notNull(),
    rewardId: int("reward_id")
      .notNull()
      .references(() => rewards.id),
    pointsSpent: int("points_spent").notNull(),
    status: redemptionStatusEnum.notNull().default("pending"),
    deliveryData: text("delivery_data"), // JSON con lo que se entregó (cupón, URL, etc.)
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .onUpdateNow(),
  },
  (table) => [
    index("redemptions_user_idx").on(table.supabaseUserId),
    index("redemptions_reward_idx").on(table.rewardId),
    index("redemptions_status_idx").on(table.status),
  ],
);
