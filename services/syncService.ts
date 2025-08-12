// services/syncService.ts
import { pageRepository } from "../db/pageRepository";
import { type Page } from "../db/schema";
import { captureAndFormatError } from "../lib/sentry/errorHandler";

export interface SyncResult {
  success: boolean;
  uploadedPages: number;
  downloadedPages: number;
  errors: string[];
}

export class SyncService {
  private baseUrl: string;
  private getAuthToken: () => Promise<string | null>;

  constructor(baseUrl: string, getAuthToken: () => Promise<string | null>) {
    this.baseUrl = baseUrl;
    this.getAuthToken = getAuthToken;
  }

  // Main sync function - call this to sync everything
  async syncAll(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      uploadedPages: 0,
      downloadedPages: 0,
      errors: [],
    };

    try {
      // 1. Push local changes to server
      const uploadResult = await this.pushToServer();
      result.uploadedPages = uploadResult.count;
      result.errors.push(...uploadResult.errors);

      // 2. Pull server changes
      const downloadResult = await this.pullFromServer();
      result.downloadedPages = downloadResult.count;
      result.errors.push(...downloadResult.errors);

      result.success = result.errors.length === 0;
    } catch (error) {
      result.success = false;
      const errorMessage = captureAndFormatError(error, {
        operation: "sync all",
        component: "SyncService",
        level: "error",
      });
      result.errors.push(`Sync failed: ${errorMessage}`);
    }

    return result;
  }

  // Push dirty pages to server
  private async pushToServer(): Promise<{ count: number; errors: string[] }> {
    const errors: string[] = [];
    let count = 0;

    try {
      const dirtyPages = await pageRepository.getDirtyPages();

      for (const page of dirtyPages) {
        try {
          if (page.server_id === null) {
            // New page - POST to server
            await this.createPageOnServer(page);
          } else {
            // Existing page - PUT to server
            await this.updatePageOnServer(page);
          }
          count++;
        } catch (error) {
          const errorMessage = captureAndFormatError(error, {
            operation: "sync individual page",
            component: "SyncService",
            context: { pageId: page.id, hasServerId: page.server_id !== null },
          });
          errors.push(`Failed to sync page ${page.id}: ${errorMessage}`);
        }
      }
    } catch (error) {
      const errorMessage = captureAndFormatError(error, {
        operation: "get dirty pages",
        component: "SyncService",
        level: "error",
      });
      errors.push(`Failed to get dirty pages: ${errorMessage}`);
    }

    return { count, errors };
  }

  // Pull updates from server
  private async pullFromServer(): Promise<{ count: number; errors: string[] }> {
    const errors: string[] = [];
    let count = 0;

    try {
      const token = await this.getAuthToken();
      if (!token) throw new Error("No auth token");

      // Get updates since last sync
      const response = await fetch(`${this.baseUrl}/api/pages/updates`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const serverPages = await response.json();

      for (const serverPage of serverPages) {
        try {
          // Find local page by server_id
          const localPage = await pageRepository.findByServerId(serverPage.id);

          if (localPage) {
            // Update existing local page
            await pageRepository.updateFromServer(localPage.id, {
              title: serverPage.title,
              content: serverPage.content,
              content_type: serverPage.content_type,
              updated_at: serverPage.updated_at,
            });
          } else {
            // Create new local page from server data
            await pageRepository.createPage({
              title: serverPage.title,
              content: serverPage.content,
              content_type: serverPage.content_type || "page",
            });

            // Mark as synced immediately
            const [newPage] = await pageRepository.getActivePages();
            await pageRepository.markAsSynced(newPage.id, serverPage.id);
          }

          count++;
        } catch (error) {
          const errorMessage = captureAndFormatError(error, {
            operation: "process server page",
            component: "SyncService",
            context: { serverPageId: serverPage.id },
          });
          errors.push(
            `Failed to process server page ${serverPage.id}: ${errorMessage}`
          );
        }
      }
    } catch (error) {
      const errorMessage = captureAndFormatError(error, {
        operation: "fetch from server",
        component: "SyncService",
        level: "error",
        context: { endpoint: `${this.baseUrl}/api/pages/updates` },
      });
      errors.push(`Failed to fetch from server: ${errorMessage}`);
    }

    return { count, errors };
  }

  // Create new page on server
  private async createPageOnServer(page: Page): Promise<void> {
    try {
      const token = await this.getAuthToken();
      if (!token) throw new Error("No auth token");

      const response = await fetch(`${this.baseUrl}/api/pages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: page.title,
          content: page.content,
          content_type: page.content_type,
          created_at: page.created_at,
          updated_at: page.updated_at,
          deleted: page.deleted,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create page: ${response.status}`);
      }

      const serverPage = await response.json();

      // Update local page with server ID
      await pageRepository.markAsSynced(page.id, serverPage.id);
    } catch (error) {
      // Re-throw with better context for the caller
      const errorMessage = captureAndFormatError(error, {
        operation: "create page on server",
        component: "SyncService",
        context: {
          pageId: page.id,
          pageTitle: page.title,
          endpoint: `${this.baseUrl}/api/pages`,
        },
      });
      throw new Error(errorMessage);
    }
  }

  // Update existing page on server
  private async updatePageOnServer(page: Page): Promise<void> {
    try {
      const token = await this.getAuthToken();
      if (!token) throw new Error("No auth token");

      const response = await fetch(
        `${this.baseUrl}/api/pages/${page.server_id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: page.title,
            content: page.content,
            content_type: page.content_type,
            updated_at: page.updated_at,
            deleted: page.deleted,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update page: ${response.status}`);
      }

      // Mark as synced
      await pageRepository.markAsSynced(page.id, page.server_id!);
    } catch (error) {
      // Re-throw with better context for the caller
      const errorMessage = captureAndFormatError(error, {
        operation: "update page on server",
        component: "SyncService",
        context: {
          pageId: page.id,
          serverId: page.server_id,
          pageTitle: page.title,
          endpoint: `${this.baseUrl}/api/pages/${page.server_id}`,
        },
      });
      throw new Error(errorMessage);
    }
  }
}
