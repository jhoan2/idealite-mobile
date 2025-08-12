// db/pageRepository.ts
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "../providers/DatabaseProvider";
import {
  getCurrentUTCTimestamp,
  pages,
  type NewPage,
  type Page,
} from "./schema";

export const pageRepository = {
  // Get all pages that need syncing
  getDirtyPages: async (): Promise<Page[]> => {
    return await db.select().from(pages).where(eq(pages.is_dirty, true));
  },

  // Get pages that are new (created offline)
  getNewPages: async (): Promise<Page[]> => {
    return await db
      .select()
      .from(pages)
      .where(and(isNull(pages.server_id), eq(pages.is_dirty, true)));
  },

  // Get pages that are modified (have server_id but dirty)
  getModifiedPages: async (): Promise<Page[]> => {
    return await db
      .select()
      .from(pages)
      .where(and(isNotNull(pages.server_id), eq(pages.is_dirty, true)));
  },

  // Create new page (offline-first)
  createPage: async (
    pageData: Omit<
      NewPage,
      "id" | "server_id" | "created_at" | "updated_at" | "is_dirty"
    >
  ): Promise<Page> => {
    const now = getCurrentUTCTimestamp();
    const newPage: NewPage = {
      ...pageData,
      server_id: null, // No server ID yet
      created_at: now,
      updated_at: now,
      is_dirty: true, // Needs sync
    };

    const [page] = await db.insert(pages).values(newPage).returning();
    return page;
  },

  // Update existing page
  updatePage: async (
    id: number,
    updates: Partial<Pick<Page, "title" | "content" | "content_type">>
  ): Promise<Page> => {
    const now = getCurrentUTCTimestamp();

    const [page] = await db
      .update(pages)
      .set({
        ...updates,
        updated_at: now,
        is_dirty: true, // Mark as needing sync
      })
      .where(eq(pages.id, id))
      .returning();

    return page;
  },

  // Soft delete page
  deletePage: async (id: number): Promise<Page> => {
    const now = getCurrentUTCTimestamp();

    const [page] = await db
      .update(pages)
      .set({
        deleted: true,
        updated_at: now,
        is_dirty: true, // Mark as needing sync
      })
      .where(eq(pages.id, id))
      .returning();

    return page;
  },

  // Mark page as synced (called after successful sync)
  markAsSynced: async (id: number, serverId: string): Promise<Page> => {
    const now = getCurrentUTCTimestamp();

    const [page] = await db
      .update(pages)
      .set({
        server_id: serverId,
        is_dirty: false,
        last_synced_at: now,
      })
      .where(eq(pages.id, id))
      .returning();

    return page;
  },

  // Update from server data (during pull sync)
  updateFromServer: async (
    localId: number,
    serverData: Partial<Page>
  ): Promise<Page> => {
    const [page] = await db
      .update(pages)
      .set({
        ...serverData,
        is_dirty: false, // Server data is clean
        last_synced_at: getCurrentUTCTimestamp(),
      })
      .where(eq(pages.id, localId))
      .returning();

    return page;
  },

  // Get all active pages (not deleted)
  getActivePages: async (): Promise<Page[]> => {
    return await db.select().from(pages).where(eq(pages.deleted, false));
  },

  // Find page by server ID
  findByServerId: async (serverId: string): Promise<Page | undefined> => {
    const [page] = await db
      .select()
      .from(pages)
      .where(eq(pages.server_id, serverId))
      .limit(1);

    return page;
  },
};
