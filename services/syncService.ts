// services/syncService.ts
import { pageRepository } from "../db/pageRepository";
import { type SyncOperation } from "../store/syncStore";

export class SyncService {
  private baseUrl: string;
  private getAuthToken: () => Promise<string | null>;

  constructor(baseUrl: string, getAuthToken: () => Promise<string | null>) {
    this.baseUrl = baseUrl;
    this.getAuthToken = getAuthToken;
  }

  // ================================
  // Push Operations (existing)
  // ================================

  async executeOperation(operation: SyncOperation): Promise<void> {
    switch (operation.operationType) {
      case "create":
        await this.createPageOnServer(operation);
        break;
      case "update":
        await this.updatePageOnServer(operation);
        break;
      case "delete":
        await this.deletePageOnServer(operation);
        break;
    }
  }

  private async createPageOnServer(operation: SyncOperation): Promise<void> {
    const token = await this.getAuthToken();
    if (!token) throw new Error("No auth token");

    const response = await fetch(`${this.baseUrl}/api/v1/sync/pages/push`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        creates: [
          {
            client_id: operation.localId,
            ...operation.data,
          },
        ],
        updates: [],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create page: ${response.status}`);
    }

    const result = await response.json();

    // Handle conflicts (server wins)
    if (result.conflicts && result.conflicts.length > 0) {
      const conflict = result.conflicts[0];
      await pageRepository.updateFromServer(
        operation.localId,
        conflict.server_page
      );
      return;
    }

    // Success - update local page with server ID
    if (result.created && result.created.length > 0) {
      const serverData = result.created[0];
      await pageRepository.markAsSynced(
        operation.localId,
        serverData.server_id
      );
    }
  }

  private async updatePageOnServer(operation: SyncOperation): Promise<void> {
    const token = await this.getAuthToken();
    if (!token) throw new Error("No auth token");

    const response = await fetch(`${this.baseUrl}/api/v1/sync/pages/push`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        creates: [],
        updates: [
          {
            server_id: operation.serverId,
            ...operation.data,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update page: ${response.status}`);
    }

    const result = await response.json();

    // Handle conflicts (server wins)
    if (result.conflicts && result.conflicts.length > 0) {
      const conflict = result.conflicts[0];
      await pageRepository.updateFromServer(
        operation.localId,
        conflict.server_page
      );
      return;
    }

    // Success
    if (result.updated && result.updated.length > 0) {
      await pageRepository.markAsSynced(operation.localId, operation.serverId!);
    }
  }

  private async deletePageOnServer(operation: SyncOperation): Promise<void> {
    // Similar to update, but with deleted: true
    await this.updatePageOnServer({
      ...operation,
      data: { ...operation.data, deleted: true },
    });
  }

  // ================================
  // Pull Operations (new)
  // ================================

  /**
   * Pull updates from server and apply to local database
   * @param sinceTimestamp - Only pull updates since this timestamp
   * @returns Number of pages updated locally
   */
  async pullFromServer(sinceTimestamp?: string): Promise<number> {
    const token = await this.getAuthToken();
    if (!token) throw new Error("No auth token");

    // Build URL with since parameter
    const url = new URL(`${this.baseUrl}/api/v1/sync/pages/pull`);
    if (sinceTimestamp) {
      url.searchParams.set("since", sinceTimestamp);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to pull from server: ${response.status}`);
    }

    const result = await response.json();
    const { pages: serverPages, server_timestamp } = result;

    let updatedCount = 0;

    // Apply each server page to local database
    for (const serverPage of serverPages) {
      try {
        await this.applyServerPage(serverPage);
        updatedCount++;
      } catch (error) {
        console.error(`Failed to apply server page ${serverPage.id}:`, error);
        // Continue with other pages even if one fails
      }
    }

    return updatedCount;
  }

  /**
   * Apply a single server page to local database
   */
  private async applyServerPage(serverPage: any): Promise<void> {
    // Check if we already have this page locally
    const existingPage = await pageRepository.findByServerId(serverPage.id);

    if (existingPage) {
      // Update existing page
      await pageRepository.updateFromServer(existingPage.id, {
        title: serverPage.title,
        content: serverPage.content,
        content_type: serverPage.content_type,
        updated_at: serverPage.updated_at,
        deleted: serverPage.deleted,
        description: serverPage.description,
        image_previews: serverPage.image_previews
          ? JSON.stringify(serverPage.image_previews)
          : null,
      });
    } else {
      // Create new page from server
      await this.createLocalPageFromServer(serverPage);
    }
  }

  /**
   * Create a new local page from server data
   */
  private async createLocalPageFromServer(serverPage: any): Promise<void> {
    const newPageData = {
      title: serverPage.title,
      content: serverPage.content,
      content_type: serverPage.content_type,
      deleted: serverPage.deleted || false,
      description: serverPage.description,
      image_previews: serverPage.image_previews
        ? JSON.stringify(serverPage.image_previews)
        : null,
    };

    // Create the page
    const localPage = await pageRepository.createPage(newPageData);

    // Mark it as synced with the server ID
    await pageRepository.markAsSynced(localPage.id, serverPage.id);
  }

  // ================================
  // Full Sync Operations
  // ================================

  /**
   * Perform a complete sync: push local changes, then pull server updates
   * @param lastSyncTimestamp - Timestamp of last successful sync
   * @returns Sync result summary
   */
  async performFullSync(lastSyncTimestamp?: string): Promise<{
    pushedOperations: number;
    pulledPages: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let pushedOperations = 0;
    let pulledPages = 0;

    try {
      // Step 1: Push all dirty local pages
      const dirtyPages = await pageRepository.getDirtyPages();

      for (const page of dirtyPages) {
        try {
          if (!page.server_id) {
            // New page - create on server
            await this.executeOperation({
              id: `sync-${Date.now()}-${Math.random()}`,
              operationType: "create",
              localId: page.id,
              serverId: null,
              data: {
                title: page.title,
                content: page.content,
                content_type: page.content_type,
                created_at: page.created_at,
                updated_at: page.updated_at,
                deleted: page.deleted,
              },
              timestamp: new Date().toISOString(),
              retryCount: 0,
            });
          } else if (page.deleted) {
            // Deleted page - update on server
            await this.executeOperation({
              id: `sync-${Date.now()}-${Math.random()}`,
              operationType: "delete",
              localId: page.id,
              serverId: page.server_id,
              data: {
                deleted: true,
                updated_at: page.updated_at,
              },
              timestamp: new Date().toISOString(),
              retryCount: 0,
            });
          } else {
            // Modified page - update on server
            await this.executeOperation({
              id: `sync-${Date.now()}-${Math.random()}`,
              operationType: "update",
              localId: page.id,
              serverId: page.server_id,
              data: {
                title: page.title,
                content: page.content,
                updated_at: page.updated_at,
              },
              timestamp: new Date().toISOString(),
              retryCount: 0,
            });
          }
          pushedOperations++;
        } catch (error) {
          errors.push(`Failed to push page ${page.id}: ${error}`);
        }
      }

      // Step 2: Pull updates from server
      try {
        pulledPages = await this.pullFromServer(lastSyncTimestamp);
      } catch (error) {
        errors.push(`Failed to pull from server: ${error}`);
      }
    } catch (error) {
      errors.push(`Full sync failed: ${error}`);
    }

    return {
      pushedOperations,
      pulledPages,
      errors,
    };
  }

  /**
   * Get the timestamp of the last successful sync
   */
  async getLastSyncTimestamp(): Promise<string | null> {
    // This could be stored in your sync store or a separate settings table
    // For now, we'll use a simple approach - get the most recent last_synced_at
    const pages = await pageRepository.getActivePages();
    const timestamps = pages
      .map((p) => p.last_synced_at)
      .filter((t) => t !== null)
      .sort()
      .reverse();

    return timestamps[0] || null;
  }
}
