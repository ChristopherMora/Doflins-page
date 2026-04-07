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

export const tradeStatusEnum = mysqlEnum("trade_status", [
  "open",      // Listing is open for offers
  "pending",   // Has a pending offer
  "completed", // Trade completed
  "cancelled", // User cancelled listing
]);

export const tradeOfferStatusEnum = mysqlEnum("trade_offer_status", [
  "pending",   // Waiting for response
  "accepted",  // Offer accepted
  "rejected",  // Offer rejected
  "withdrawn", // Offerer cancelled
]);

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
    index("codigos_bolsa_doflin_idx").on(table.doflinId),
  ],
);

export const codigosBolsaItems = mysqlTable(
  "codigos_bolsa_items",
  {
    id: int("id").autoincrement().primaryKey(),
    codigoBolsaId: int("codigo_bolsa_id")
      .notNull()
      .references(() => codigosBolsa.id, { onDelete: "cascade" }),
    doflinId: int("doflin_id")
      .notNull()
      .references(() => doflins.id, { onDelete: "cascade" }),
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
    codigoBolsaId: int("codigo_bolsa_id").references(() => codigosBolsa.id, { onDelete: "set null" }),
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
    currentStreak: int("current_streak").notNull().default(0),
    longestStreak: int("longest_streak").notNull().default(0),
    lastRevealDate: varchar("last_reveal_date", { length: 10 }), // "YYYY-MM-DD"
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
      .references(() => referralCodes.id, { onDelete: "cascade" }),
    usedByEmail: varchar("used_by_email", { length: 190 }),
    shopifyOrderId: varchar("shopify_order_id", { length: 64 }),
    discountApplied: int("discount_applied").notNull().default(0),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("referral_uses_code_idx").on(table.referralCodeId),
    index("referral_uses_email_idx").on(table.usedByEmail),
    uniqueIndex("referral_uses_code_email_unique").on(table.referralCodeId, table.usedByEmail),
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
      .references(() => doflins.id, { onDelete: "cascade" }),
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
  "daily_claim",   // vio la figura del día
  "streak_bonus",  // bonus por racha consecutiva
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
      .references(() => rewards.id, { onDelete: "cascade" }),
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

// ────────────────────────────────────────────────────────────────────────────────
// NOTIFICATION PREFERENCES
// ────────────────────────────────────────────────────────────────────────────────

export const notificationPreferences = mysqlTable(
  "notification_preferences",
  {
    id: int("id").autoincrement().primaryKey(),
    supabaseUserId: varchar("supabase_user_id", { length: 64 }).notNull(),
    // Email notifications
    emailNewFigure: boolean("email_new_figure").notNull().default(true),
    emailWeeklyDigest: boolean("email_weekly_digest").notNull().default(true),
    emailRewardAvailable: boolean("email_reward_available").notNull().default(true),
    emailTradeRequest: boolean("email_trade_request").notNull().default(true),
    // Push notifications (for future use)
    pushEnabled: boolean("push_enabled").notNull().default(false),
    pushSubscription: text("push_subscription"), // JSON with push subscription data
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .onUpdateNow(),
  },
  (table) => [
    uniqueIndex("notif_prefs_user_unique").on(table.supabaseUserId),
  ],
);

// ────────────────────────────────────────────────────────────────────────────────
// TRADE SYSTEM
// ────────────────────────────────────────────────────────────────────────────────

export const tradeListings = mysqlTable(
  "trade_listings",
  {
    id: int("id").autoincrement().primaryKey(),
    supabaseUserId: varchar("supabase_user_id", { length: 64 }).notNull(),
    // What they want to trade away (can be multiple IDs comma-separated for flexibility)
    offeringDoflinId: int("offering_doflin_id")
      .notNull()
      .references(() => doflins.id),
    // What they want in return (null = open to offers)
    wantingDoflinId: int("wanting_doflin_id").references(() => doflins.id),
    wantingRarity: rarityEnum, // Alternative: accept any of this rarity or higher
    notes: text("notes"), // Optional message
    status: tradeStatusEnum.notNull().default("open"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .onUpdateNow(),
  },
  (table) => [
    index("trade_listings_user_idx").on(table.supabaseUserId),
    index("trade_listings_status_idx").on(table.status),
    index("trade_listings_offering_idx").on(table.offeringDoflinId),
    index("trade_listings_wanting_idx").on(table.wantingDoflinId),
  ],
);

export const tradeOffers = mysqlTable(
  "trade_offers",
  {
    id: int("id").autoincrement().primaryKey(),
    listingId: int("listing_id")
      .notNull()
      .references(() => tradeListings.id, { onDelete: "cascade" }),
    offererUserId: varchar("offerer_user_id", { length: 64 }).notNull(),
    // What the offerer is offering in return
    offeredDoflinId: int("offered_doflin_id")
      .notNull()
      .references(() => doflins.id, { onDelete: "cascade" }),
    message: text("message"),
    status: tradeOfferStatusEnum.notNull().default("pending"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .onUpdateNow(),
  },
  (table) => [
    index("trade_offers_listing_idx").on(table.listingId),
    index("trade_offers_offerer_idx").on(table.offererUserId),
    index("trade_offers_status_idx").on(table.status),
  ],
);

// ────────────────────────────────────────────────────────────────────────────────
// DAILY FIGURE & STREAK SYSTEM
// ────────────────────────────────────────────────────────────────────────────────

export const dailyFigures = mysqlTable(
  "daily_figures",
  {
    id: int("id").autoincrement().primaryKey(),
    doflinId: int("doflin_id")
      .notNull()
      .references(() => doflins.id),
    date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
    pointsReward: int("points_reward").notNull().default(5),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("daily_figures_date_unique").on(table.date),
    index("daily_figures_doflin_idx").on(table.doflinId),
  ],
);

export const dailyClaims = mysqlTable(
  "daily_claims",
  {
    id: int("id").autoincrement().primaryKey(),
    supabaseUserId: varchar("supabase_user_id", { length: 64 }).notNull(),
    dailyFigureId: int("daily_figure_id")
      .notNull()
      .references(() => dailyFigures.id, { onDelete: "cascade" }),
    pointsAwarded: int("points_awarded").notNull(),
    streakBonus: int("streak_bonus").notNull().default(0),
    claimedAt: timestamp("claimed_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("daily_claims_user_figure_unique").on(table.supabaseUserId, table.dailyFigureId),
    index("daily_claims_user_idx").on(table.supabaseUserId),
  ],
);

export const userStreaks = mysqlTable(
  "user_streaks",
  {
    id: int("id").autoincrement().primaryKey(),
    supabaseUserId: varchar("supabase_user_id", { length: 64 }).notNull(),
    currentStreak: int("current_streak").notNull().default(0),
    longestStreak: int("longest_streak").notNull().default(0),
    lastClaimDate: varchar("last_claim_date", { length: 10 }), // YYYY-MM-DD
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .onUpdateNow(),
  },
  (table) => [
    uniqueIndex("user_streaks_user_unique").on(table.supabaseUserId),
  ],
);

// ────────────────────────────────────────────────────────────────────────────────
// PUBLIC WANT LIST - figures users want to collect
// ────────────────────────────────────────────────────────────────────────────────

export const wantListPriorityEnum = mysqlEnum("want_list_priority", [
  "low",      // Nice to have
  "medium",   // Want it
  "high",     // Really want it
]);

export const figureWantList = mysqlTable(
  "figure_want_list",
  {
    id: int("id").autoincrement().primaryKey(),
    supabaseUserId: varchar("supabase_user_id", { length: 64 }).notNull(),
    doflinId: int("doflin_id")
      .notNull()
      .references(() => doflins.id, { onDelete: "cascade" }),
    priority: wantListPriorityEnum.notNull().default("medium"),
    notes: varchar("notes", { length: 200 }), // Short note about why they want it
    isPublic: boolean("is_public").notNull().default(true),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .onUpdateNow(),
  },
  (table) => [
    uniqueIndex("want_list_user_doflin_unique").on(table.supabaseUserId, table.doflinId),
    index("want_list_user_idx").on(table.supabaseUserId),
    index("want_list_doflin_idx").on(table.doflinId),
    index("want_list_public_idx").on(table.isPublic),
  ],
);
