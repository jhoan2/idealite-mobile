// services/syncService.ts - Updated with better error handling and full page objects
import * as Sentry from "@sentry/react-native";
import { pageRepository } from "../db/pageRepository";
import { type SyncOperation } from "../store/syncStore";

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

  // ================================
  // Helper Functions
  // ================================

  /**
   * Get full page data from local database and ensure all required fields
   */
  private async getFullPageData(localId: number) {
    const page = await pageRepository.findById(localId);
    if (!page) {
      throw new Error(`Page not found with ID: ${localId}`);
    }

    // Parse image_previews and ensure it's always an array
    let imagePreviews: string[] = [];
    if (page.image_previews) {
      try {
        const parsed = JSON.parse(page.image_previews);
        imagePreviews = Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.warn(
          "Failed to parse image_previews, using empty array:",
          error
        );
        imagePreviews = [];
      }
    }

    return {
      title: page.title,
      content: page.content || "", // Ensure content is never null
      content_type: page.content_type,
      canvas_image_cid: page.canvas_image_cid || null,
      description: page.description || null,
      image_previews: imagePreviews, // Always an array
      created_at: page.created_at,
      updated_at: page.updated_at,
      deleted: page.deleted,
    };
  }

  /**
   * Handle sync errors gracefully with retry logic
   */
  private handleSyncError(error: any, operation: string): never {
    let errorMessage = `${operation} failed: `;

    if (error.status === 400 && error.response?.details) {
      // Zod validation errors
      const details = error.response.details;
      errorMessage += details
        .map((d: any) => `${d.path?.join(".")} ${d.message}`)
        .join(", ");

      Sentry.captureException(new Error(errorMessage), {
        tags: {
          component: "SyncService",
          errorType: "validation",
          operation,
        },
        extra: { validationErrors: details },
      });
    } else if (error.status === 401) {
      errorMessage += "Authentication failed";
    } else if (error.status >= 500) {
      errorMessage += "Server error";
    } else {
      errorMessage += error.message || "Unknown error";
    }

    throw new Error(errorMessage);
  }

  // ================================
  // Push Operations (updated)
  // ================================

  async executeOperation(operation: SyncOperation): Promise<void> {
    try {
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
    } catch (error) {
      this.handleSyncError(error, `${operation.operationType} page`);
    }
  }

  private async createPageOnServer(operation: SyncOperation): Promise<void> {
    const token = await this.getAuthToken();
    if (!token) throw new Error("No auth token");

    // Get full page data from local database
    const fullPageData = await this.getFullPageData(operation.localId);

    const requestBody = {
      creates: [
        {
          client_id: operation.localId,
          ...fullPageData,
        },
      ],
      updates: [],
    };

    console.log(
      "Creating page on server:",
      JSON.stringify(requestBody, null, 2)
    );

    const response = await fetch(`${this.baseUrl}/api/v1/sync/pages/push`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(`HTTP ${response.status}`);
      (error as any).status = response.status;
      (error as any).response = errorData;
      throw error;
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

    // Get full page data from local database
    const fullPageData = await this.getFullPageData(operation.localId);

    const requestBody = {
      creates: [],
      updates: [
        {
          server_id: operation.serverId,
          ...fullPageData,
        },
      ],
    };

    const response = await fetch(`${this.baseUrl}/api/v1/sync/pages/push`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(`HTTP ${response.status}`);
      (error as any).status = response.status;
      (error as any).response = errorData;
      throw error;
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
    const token = await this.getAuthToken();
    if (!token) throw new Error("No auth token");

    // For delete, we still need the full data but mark as deleted
    const fullPageData = await this.getFullPageData(operation.localId);

    const requestBody = {
      creates: [],
      updates: [
        {
          server_id: operation.serverId,
          ...fullPageData,
          deleted: true, // Override to ensure it's marked as deleted
        },
      ],
    };

    const response = await fetch(`${this.baseUrl}/api/v1/sync/pages/push`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(`HTTP ${response.status}`);
      (error as any).status = response.status;
      (error as any).response = errorData;
      throw error;
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

  // ================================
  // Pull Operations (updated error handling)
  // ================================

  async pullFromServer(sinceTimestamp?: string): Promise<{
    pulled_count: number;
    server_timestamp: string;
    pages: any[];
  }> {
    try {
      const token = await this.getAuthToken();
      if (!token) throw new Error("No auth token");

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
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(`HTTP ${response.status}`);
        (error as any).status = response.status;
        (error as any).response = errorData;
        throw error;
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
          Sentry.captureException(error, {
            tags: { component: "SyncService", operation: "applyServerPage" },
            extra: { pageId: serverPage.id },
          });
          // Continue with other pages even if one fails
        }
      }

      return {
        pulled_count: updatedCount,
        server_timestamp: server_timestamp,
        pages: serverPages,
      };
    } catch (error) {
      this.handleSyncError(error, "pull from server");
    }
  }

  private async applyServerPage(serverPage: any): Promise<void> {
    // Check if we already have this page locally
    const existingPage = await pageRepository.findByServerId(serverPage.id);

    // Ensure image_previews is properly handled
    const imagePreviewsJson = serverPage.image_previews
      ? JSON.stringify(
          Array.isArray(serverPage.image_previews)
            ? serverPage.image_previews
            : []
        )
      : null;

    if (existingPage) {
      // Update existing page
      await pageRepository.updateFromServer(existingPage.id, {
        title: serverPage.title,
        content: serverPage.content,
        content_type: serverPage.content_type,
        canvas_image_cid: serverPage.canvas_image_cid,
        updated_at: serverPage.updated_at,
        deleted: serverPage.deleted,
        description: serverPage.description,
        image_previews: imagePreviewsJson,
      });
    } else {
      // Create new page from server
      await this.createLocalPageFromServer(serverPage);
    }
  }

  private async createLocalPageFromServer(serverPage: any): Promise<void> {
    const imagePreviewsJson = serverPage.image_previews
      ? JSON.stringify(
          Array.isArray(serverPage.image_previews)
            ? serverPage.image_previews
            : []
        )
      : null;

    const newPageData = {
      title: serverPage.title,
      content: serverPage.content,
      content_type: serverPage.content_type,
      canvas_image_cid: serverPage.canvas_image_cid,
      deleted: serverPage.deleted || false,
      description: serverPage.description,
      image_previews: imagePreviewsJson,
    };

    // Create the page
    const localPage = await pageRepository.createPage(newPageData);

    // Mark it as synced with the server ID
    await pageRepository.markAsSynced(localPage.id, serverPage.id);
  }

  // ================================
  // Full Sync Operations
  // ================================

  async performFullSync(lastSyncTimestamp?: string): Promise<{
    pushedOperations: number;
    pulledPages: number;
    server_timestamp?: string;
    errors: string[];
  }> {
    const errors: string[] = [];
    let pushedOperations = 0;
    let pulledPages = 0;
    let server_timestamp: string | undefined;

    try {
      // Step 1: Push all dirty local pages
      const dirtyPages = await pageRepository.getDirtyPages();

      for (const page of dirtyPages) {
        try {
          const fullPageData = await this.getFullPageData(page.id);

          if (!page.server_id) {
            // New page - create on server
            await this.executeOperation({
              id: `sync-${Date.now()}-${Math.random()}`,
              operationType: "create",
              localId: page.id,
              serverId: null,
              data: fullPageData,
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
              data: { ...fullPageData, deleted: true },
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
              data: fullPageData,
              timestamp: new Date().toISOString(),
              retryCount: 0,
            });
          }
          pushedOperations++;
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : String(error);
          errors.push(`Failed to push page ${page.id}: ${errorMsg}`);
        }
      }

      // Step 2: Pull updates from server
      try {
        const pullResult = await this.pullFromServer(lastSyncTimestamp);
        pulledPages = pullResult.pulled_count;
        server_timestamp = pullResult.server_timestamp;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`Failed to pull from server: ${errorMsg}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(`Full sync failed: ${errorMsg}`);
    }

    return {
      pushedOperations,
      pulledPages,
      server_timestamp,
      errors,
    };
  }

  async syncAll(): Promise<SyncResult> {
    try {
      const result = await this.performFullSync();

      return {
        success: result.errors.length === 0,
        uploadedPages: result.pushedOperations,
        downloadedPages: result.pulledPages,
        errors: result.errors,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        uploadedPages: 0,
        downloadedPages: 0,
        errors: [errorMsg],
      };
    }
  }
}
