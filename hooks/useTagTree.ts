// hooks/useTagTree.ts
import { useAuth } from "@clerk/clerk-expo";
import * as Sentry from "@sentry/react-native";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  batchUpdateCollapsedState,
  BatchUpdateRequest,
  fetchTagTree,
  TreeFolder,
  TreeTag,
} from "../lib/api/tagTree";

interface UseTagTreeReturn {
  // Server state
  tagTree: TreeTag[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<any>;

  // Client state
  toggleTag: (tagId: string) => void;
  toggleFolder: (folderId: string) => void;
  isTagExpanded: (tagId: string) => boolean;
  isFolderExpanded: (folderId: string) => boolean;

  // Sync state
  isUpdating: boolean;
  hasPendingUpdates: boolean;
  forceSyncPendingUpdates: () => void;
}

export const useTagTree = (): UseTagTreeReturn => {
  const { getToken } = useAuth();

  // Client state for expanded/collapsed UI
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );

  // Track pending updates for batching
  const [pendingUpdates, setPendingUpdates] = useState<{
    tags: Map<string, boolean>;
    folders: Map<string, boolean>;
  }>({
    tags: new Map(),
    folders: new Map(),
  });

  // Debounce timer ref (use number for React Native compatibility)
  const debounceRef = useRef<number | null>(null);

  // React Query: Fetch tag tree
  const {
    data: tagTree = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["tagTree"],
    queryFn: () => fetchTagTree(getToken),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (renamed from cacheTime)
    refetchOnWindowFocus: true, // Sync when app comes to foreground
    refetchOnReconnect: true, // Sync when network reconnects
    retry: (failureCount, error) => {
      // Retry up to 3 times for network errors
      if (failureCount < 3) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Handle query errors (React Query v5 removed onError from useQuery)
  useEffect(() => {
    if (error) {
      Sentry.captureException(error, {
        tags: {
          component: "useTagTree",
          action: "fetchTagTree",
        },
      });
    }
  }, [error]);

  // Initialize expanded state from server data
  useEffect(() => {
    if (tagTree.length > 0) {
      const newExpandedTags = new Set<string>();
      const newExpandedFolders = new Set<string>();

      const initializeExpanded = (tags: TreeTag[]) => {
        tags.forEach((tag) => {
          // If server says NOT collapsed, add to expanded set
          if (!tag.is_collapsed) {
            newExpandedTags.add(tag.id);
          }

          // Process folders
          if (tag.folders) {
            tag.folders.forEach((folder) => {
              if (!folder.is_collapsed) {
                newExpandedFolders.add(folder.id);
              }

              // Handle nested folders recursively
              const processFolders = (folders: TreeFolder[]) => {
                folders.forEach((f) => {
                  if (!f.is_collapsed) {
                    newExpandedFolders.add(f.id);
                  }
                  if (f.subFolders && f.subFolders.length > 0) {
                    processFolders(f.subFolders);
                  }
                });
              };

              if (folder.subFolders && folder.subFolders.length > 0) {
                processFolders(folder.subFolders);
              }
            });
          }

          // Process child tags
          if (tag.children && tag.children.length > 0) {
            initializeExpanded(tag.children);
          }
        });
      };

      initializeExpanded(tagTree);
      setExpandedTags(newExpandedTags);
      setExpandedFolders(newExpandedFolders);
    }
  }, [tagTree]);

  // Batch update mutation
  const batchUpdateMutation = useMutation({
    mutationFn: (updates: BatchUpdateRequest) =>
      batchUpdateCollapsedState(updates, getToken),
    onSuccess: (data) => {
      // Clear pending updates on success
      setPendingUpdates({
        tags: new Map(),
        folders: new Map(),
      });
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          component: "useTagTree",
          action: "batchUpdate",
        },
      });
    },
  });

  // Debounced batch sync
  const debouncedSync = useCallback(() => {
    // Clear existing timeout
    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
    }

    // Set new timeout
    debounceRef.current = setTimeout(() => {
      const { tags, folders } = pendingUpdates;

      if (tags.size > 0 || folders.size > 0) {
        const updates: BatchUpdateRequest = {
          tags: Array.from(tags.entries()).map(([id, isCollapsed]) => ({
            id,
            isCollapsed,
          })),
          folders: Array.from(folders.entries()).map(([id, isCollapsed]) => ({
            id,
            isCollapsed,
          })),
        };

        batchUpdateMutation.mutate(updates);
      }
    }, 1000) as number; // Cast to number for React Native
  }, [pendingUpdates, batchUpdateMutation]);

  // Toggle tag with optimistic update
  const toggleTag = useCallback(
    (tagId: string) => {
      try {
        setExpandedTags((prev) => {
          const newSet = new Set(prev);
          const isCurrentlyExpanded = newSet.has(tagId);

          // Optimistic UI update
          if (isCurrentlyExpanded) {
            newSet.delete(tagId);
          } else {
            newSet.add(tagId);
          }

          // Track for server sync (server expects is_collapsed boolean)
          setPendingUpdates((current) => ({
            ...current,
            tags: new Map(current.tags).set(tagId, isCurrentlyExpanded),
          }));

          // Trigger debounced sync
          debouncedSync();

          // Haptic feedback for better UX
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

          return newSet;
        });
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            component: "useTagTree",
            action: "toggleTag",
          },
          extra: { tagId },
        });
      }
    },
    [debouncedSync]
  );

  // Toggle folder with optimistic update
  const toggleFolder = useCallback(
    (folderId: string) => {
      try {
        setExpandedFolders((prev) => {
          const newSet = new Set(prev);
          const isCurrentlyExpanded = newSet.has(folderId);

          // Optimistic UI update
          if (isCurrentlyExpanded) {
            newSet.delete(folderId);
          } else {
            newSet.add(folderId);
          }

          // Track for server sync
          setPendingUpdates((current) => ({
            ...current,
            folders: new Map(current.folders).set(
              folderId,
              isCurrentlyExpanded
            ),
          }));

          // Trigger debounced sync
          debouncedSync();

          // Haptic feedback
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

          return newSet;
        });
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            component: "useTagTree",
            action: "toggleFolder",
          },
          extra: { folderId },
        });
      }
    },
    [debouncedSync]
  );

  // Utility functions
  const isTagExpanded = useCallback(
    (tagId: string) => {
      return expandedTags.has(tagId);
    },
    [expandedTags]
  );

  const isFolderExpanded = useCallback(
    (folderId: string) => {
      return expandedFolders.has(folderId);
    },
    [expandedFolders]
  );

  // Force sync pending updates (useful for onBlur or app background)
  const forceSyncPendingUpdates = useCallback(() => {
    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
    }

    const { tags, folders } = pendingUpdates;

    if (tags.size > 0 || folders.size > 0) {
      const updates: BatchUpdateRequest = {
        tags: Array.from(tags.entries()).map(([id, isCollapsed]) => ({
          id,
          isCollapsed,
        })),
        folders: Array.from(folders.entries()).map(([id, isCollapsed]) => ({
          id,
          isCollapsed,
        })),
      };

      batchUpdateMutation.mutate(updates);
    }
  }, [pendingUpdates, batchUpdateMutation]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    // Server state
    tagTree,
    isLoading,
    error,
    refetch,

    // Client state
    toggleTag,
    toggleFolder,
    isTagExpanded,
    isFolderExpanded,

    // Sync state
    isUpdating: batchUpdateMutation.isPending, // Changed from isLoading in v5
    hasPendingUpdates:
      pendingUpdates.tags.size > 0 || pendingUpdates.folders.size > 0,
    forceSyncPendingUpdates,
  };
};
