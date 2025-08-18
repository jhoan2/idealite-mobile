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
      description: null, // Explicitly null until server processes
      image_previews: null, // Explicitly null until server processes
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
  createPageWithUniqueTitle: async (
    baseTitle: string,
    pageData: Omit<
      NewPage,
      "id" | "server_id" | "created_at" | "updated_at" | "is_dirty" | "title"
    >
  ): Promise<Page> => {
    return await db.transaction(async (tx) => {
      // Find existing titles within the transaction (this locks the relevant rows)
      const existingPages = await tx
        .select({ title: pages.title })
        .from(pages)
        .where(
          and(
            eq(pages.deleted, false),
            or(
              eq(pages.title, baseTitle),
              sql`${pages.title} LIKE ${baseTitle + " (%"}`
            )
          )
        );

      // Generate unique title based on existing titles
      let uniqueTitle = baseTitle;

      if (existingPages.length > 0) {
        const usedNumbers = new Set<number>();
        let hasExactMatch = false;

        // Analyze existing titles to find used numbers
        for (const row of existingPages) {
          if (row.title === baseTitle) {
            hasExactMatch = true;
          } else {
            // Extract number from titles like "Untitled Page (2)"
            const escapedTitle = baseTitle.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&"
            );
            const regex = new RegExp(`^${escapedTitle} \\((\\d+)\\)$`);
            const match = row.title.match(regex);
            if (match) {
              const number = parseInt(match[1], 10);
              if (!isNaN(number)) {
                usedNumbers.add(number);
              }
            }
          }
        }

        // Generate the next available number
        if (hasExactMatch || usedNumbers.size > 0) {
          let nextNumber = 1;

          // If exact match exists, start from 2
          if (hasExactMatch) {
            nextNumber = 2;
          }

          // Find the next available number
          while (usedNumbers.has(nextNumber)) {
            nextNumber++;
          }

          uniqueTitle = `${baseTitle} (${nextNumber})`;
        }
      }

      // Create the page with the unique title within the same transaction
      const now = getCurrentUTCTimestamp();
      const newPage: NewPage = {
        ...pageData,
        title: uniqueTitle,
        server_id: null,
        description: null,
        image_previews: null,
        created_at: now,
        updated_at: now,
        is_dirty: true,
      };

      const [page] = await tx.insert(pages).values(newPage).returning();
      return page;
    });
  },
  updatePageWithUniqueTitle: async (
    id: number,
    baseTitle: string,
    otherUpdates?: Partial<
      Pick<
        Page,
        | "content"
        | "content_type"
        | "canvas_image_cid"
        | "description"
        | "image_previews"
      >
    >
  ): Promise<Page> => {
    return await db.transaction(async (tx) => {
      // Get the current page to make sure we don't conflict with ourselves
      const currentPage = await tx
        .select({ id: pages.id, title: pages.title })
        .from(pages)
        .where(eq(pages.id, id))
        .limit(1);

      if (!currentPage[0]) {
        throw new Error(`Page with id ${id} not found`);
      }

      // If the title hasn't changed, just do a regular update
      if (currentPage[0].title === baseTitle.trim()) {
        const now = getCurrentUTCTimestamp();
        const [page] = await tx
          .update(pages)
          .set({
            title: baseTitle.trim(),
            ...otherUpdates,
            updated_at: now,
            is_dirty: true,
          })
          .where(eq(pages.id, id))
          .returning();
        return page;
      }

      // Find existing titles, excluding the current page
      const existingPages = await tx
        .select({ title: pages.title, id: pages.id })
        .from(pages)
        .where(
          and(
            eq(pages.deleted, false),
            // Exclude the current page from conflict check
            sql`${pages.id} != ${id}`,
            or(
              eq(pages.title, baseTitle),
              sql`${pages.title} LIKE ${baseTitle + " (%"}`
            )
          )
        );

      let uniqueTitle = baseTitle;

      if (existingPages.length > 0) {
        const usedNumbers = new Set<number>();
        let hasExactMatch = false;

        for (const row of existingPages) {
          if (row.title === baseTitle) {
            hasExactMatch = true;
            console.log("🔍 [UPDATE] Found exact match with page:", row.id);
          } else {
            const escapedTitle = baseTitle.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&"
            );
            const regex = new RegExp(`^${escapedTitle} \\((\\d+)\\)$`);
            const match = row.title.match(regex);
            if (match) {
              const number = parseInt(match[1], 10);
              if (!isNaN(number)) {
                usedNumbers.add(number);
              }
            }
          }
        }

        if (hasExactMatch || usedNumbers.size > 0) {
          let nextNumber = hasExactMatch ? 2 : 1;
          while (usedNumbers.has(nextNumber)) {
            nextNumber++;
          }
          uniqueTitle = `${baseTitle} (${nextNumber})`;
        }
      }

      // Update the page with the unique title
      const now = getCurrentUTCTimestamp();
      const [page] = await tx
        .update(pages)
        .set({
          title: uniqueTitle,
          ...otherUpdates,
          updated_at: now,
          is_dirty: true,
        })
        .where(eq(pages.id, id))
        .returning();

      return page;
    });
  },
};
