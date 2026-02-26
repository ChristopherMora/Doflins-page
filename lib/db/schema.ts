import {
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTable,
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
