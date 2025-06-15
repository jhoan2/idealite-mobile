// lib/api/tagTree.ts
import * as Sentry from "@sentry/react-native";

// Types matching your backend schema
export interface TreePage {
  id: string;
  title: string | null;
  primary_tag_id: string | null;
  folder_id: string | null;
  content_type: "page" | "canvas";
}

export interface TreeFolder {
  id: string;
  name: string;
  is_collapsed: boolean;
  pages: TreePage[];
  subFolders: TreeFolder[];
  parent_folder_id: string | null;
}

export interface TreeTag {
  id: string;
  name: string;
  is_collapsed: boolean;
  is_archived: boolean;
  children: TreeTag[];
  folders: TreeFolder[];
  pages: TreePage[];
}

export interface BatchUpdateRequest {
  tags: Array<{ id: string; isCollapsed: boolean }>;
  folders: Array<{ id: string; isCollapsed: boolean }>;
}

export interface BatchUpdateResponse {
  success: boolean;
  results: {
    tags: {
      total: number;
      successful: number;
      failed: number;
    };
    folders: {
      total: number;
      successful: number;
      failed: number;
    };
  };
}

// API Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

// Fetch tag tree from server
export const fetchTagTree = async (
  getToken: () => Promise<string | null>
): Promise<TreeTag[]> => {
  try {
    const token = await getToken();

    if (!token) {
      throw new Error("No authentication token available");
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/tags/tree`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch tag tree");
    }

    return result.data;
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        component: "tagTreeAPI",
        action: "fetchTagTree",
      },
    });
    throw error;
  }
};

// Batch update collapsed state
export const batchUpdateCollapsedState = async (
  updates: BatchUpdateRequest,
  getToken: () => Promise<string | null>
): Promise<BatchUpdateResponse> => {
  try {
    const token = await getToken();

    if (!token) {
      throw new Error("No authentication token available");
    }

    const response = await fetch(
      `${API_BASE_URL}/api/v1/tags/tree/batch-update`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Batch update failed");
    }

    return result;
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        component: "tagTreeAPI",
        action: "batchUpdateCollapsedState",
      },
      extra: {
        updatesCount: {
          tags: updates.tags.length,
          folders: updates.folders.length,
        },
      },
    });
    throw error;
  }
};
