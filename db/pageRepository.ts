// db/pageRepository.ts - Updated with search functionality
import { and, desc, eq, isNotNull, isNull, or, sql } from "drizzle-orm";
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

  // Update existing page - UPDATED to include description and image_previews
  updatePage: async (
    id: number,
    updates: Partial<
      Pick<
        Page,
        | "title"
        | "content"
        | "content_type"
        | "canvas_image_cid"
        | "description"
        | "image_previews"
      >
    >
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

  // Update from server data (during pull sync) - UPDATED to include description and image_previews
  updateFromServer: async (
    localId: number,
    serverData: Partial<
      Pick<
        Page,
        | "title"
        | "content"
        | "content_type"
        | "description"
        | "image_previews"
        | "updated_at"
        | "deleted"
        | "canvas_image_cid"
      >
    >
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
  getActivePages: async (limit?: number, offset?: number): Promise<Page[]> => {
    const baseQuery = db
      .select()
      .from(pages)
      .where(eq(pages.deleted, false))
      .orderBy(desc(pages.updated_at)); // Most recent first

    // Handle different pagination scenarios
    if (limit !== undefined && offset !== undefined) {
      return await baseQuery.limit(limit).offset(offset);
    } else if (limit !== undefined) {
      return await baseQuery.limit(limit);
    } else {
      return await baseQuery;
    }
  },

  getActivePagesCount: async (): Promise<number> => {
    const result = await db
      .select({ count: pages.id })
      .from(pages)
      .where(eq(pages.deleted, false));

    return result.length;
  },

  // NEW: Search pages by title and content (case-insensitive)
  searchPages: async (query: string, limit?: number): Promise<Page[]> => {
    if (query.length < 3) {
      return [];
    }

    // Create case-insensitive search pattern
    const searchPattern = `%${query.toLowerCase()}%`;

    const searchResults = await db
      .select()
      .from(pages)
      .where(
        and(
          eq(pages.deleted, false), // Exclude deleted pages
          or(
            // Search in title (case-insensitive)
            sql`LOWER(${pages.title}) LIKE ${searchPattern}`,
            // Search in content (case-insensitive, handle null content)
            sql`LOWER(COALESCE(${pages.content}, '')) LIKE ${searchPattern}`
          )
        )
      )
      .orderBy(
        // Prioritize title matches, then by most recent
        desc(
          sql`CASE WHEN LOWER(${pages.title}) LIKE ${searchPattern} THEN 1 ELSE 0 END`
        ),
        desc(pages.updated_at)
      )
      .limit(limit || 50); // Default limit to prevent performance issues

    return searchResults;
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

  // Find page by local ID
  findById: async (id: number): Promise<Page | undefined> => {
    const [page] = await db
      .select()
      .from(pages)
      .where(eq(pages.id, id))
      .limit(1);

    return page;
  },

  // Get pages that haven't been synced yet
  getUnsyncedPages: async (): Promise<Page[]> => {
    return await db.select().from(pages).where(isNull(pages.last_synced_at));
  },

  // Get recently updated pages (for debugging)
  getRecentlyUpdated: async (hours: number = 24): Promise<Page[]> => {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hours);

    return await db
      .select()
      .from(pages)
      .where(
        and(
          eq(pages.deleted, false),
          // Note: SQLite doesn't have built-in date comparison, so we compare as strings
          // This works because ISO strings are lexicographically ordered
          eq(pages.updated_at, cutoff.toISOString())
        )
      );
  },

  // Clear all pages (for testing/reset)
  clearAll: async (): Promise<void> => {
    await db.delete(pages);
  },

  // Get sync statistics
  getSyncStats: async (): Promise<{
    total: number;
    dirty: number;
    synced: number;
    unsynced: number;
  }> => {
    const allPages = await db.select().from(pages);

    const stats = {
      total: allPages.length,
      dirty: allPages.filter((p) => p.is_dirty).length,
      synced: allPages.filter((p) => p.last_synced_at !== null).length,
      unsynced: allPages.filter((p) => p.last_synced_at === null).length,
    };

    return stats;
  },

  // Batch operations for efficiency
  batchCreatePages: async (
    pagesData: Array<
      Omit<
        NewPage,
        "id" | "server_id" | "created_at" | "updated_at" | "is_dirty"
      >
    >
  ): Promise<Page[]> => {
    const now = getCurrentUTCTimestamp();
    const newPages = pagesData.map((pageData) => ({
      ...pageData,
      server_id: null,
      created_at: now,
      updated_at: now,
      is_dirty: true,
    }));

    return await db.insert(pages).values(newPages).returning();
  },

  // Legacy search method (now uses the new searchPages method)
  searchByTitle: async (query: string): Promise<Page[]> => {
    return await pageRepository.searchPages(query);
  },
};
