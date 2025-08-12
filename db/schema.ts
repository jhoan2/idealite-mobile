import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Offline pages table
export const pages = sqliteTable("pages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  server_id: text("server_id").unique(), // Maps to PostgreSQL UUID, NULL for new offline pages
  title: text("title").notNull(),
  content: text("content"),
  content_type: text("content_type", { enum: ["page", "canvas"] })
    .notNull()
    .default("page"),
  created_at: text("created_at").notNull(), // ISO8601 UTC: "2025-08-11T10:30:00.000Z"
  updated_at: text("updated_at").notNull(), // ISO8601 UTC: "2025-08-11T10:30:00.000Z"
  is_dirty: integer("is_dirty", { mode: "boolean" }).notNull().default(false), // Boolean: false=clean, true=needs sync
  last_synced_at: text("last_synced_at"), // ISO8601 UTC, NULL if never synced
  deleted: integer("deleted", { mode: "boolean" }).notNull().default(false), // Soft delete flag
});

export const serverIdIdx = index("idx_pages_server_id").on(pages.server_id);
export const isDirtyIdx = index("idx_pages_is_dirty").on(pages.is_dirty);
export const updatedAtIdx = index("idx_pages_updated_at").on(pages.updated_at);
export const deletedIdx = index("idx_pages_deleted").on(pages.deleted);

export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;

// Helper function to get current UTC timestamp in ISO8601 format
export const getCurrentUTCTimestamp = () => new Date().toISOString();
