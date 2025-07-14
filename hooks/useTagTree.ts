import { useAuth } from "@clerk/clerk-expo";
import * as Sentry from "@sentry/react-native";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  batchUpdateCollapsedState,
  BatchUpdateRequest,
  fetchTagTree,
  TreeFolder,
  TreePage,
  TreeTag,
} from "../lib/api/tagTree";

interface UseTagTreeReturn {
  tagTree: TreeTag[];
  filteredTagTree: TreeTag[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<any>;
  showArchived: boolean;
  toggleShowArchived: () => void;

  toggleTag: (tagId: string) => void;
  toggleFolder: (folderId: string) => void;
  isTagExpanded: (tagId: string) => boolean;
  isFolderExpanded: (folderId: string) => boolean;

  isUpdating: boolean;
  hasPendingUpdates: boolean;
  forceSyncPendingUpdates: () => void;
}

export const useTagTree = (): UseTagTreeReturn => {
  const { getToken } = useAuth();

  // Archive state
  const [showArchived, setShowArchived] = useState(false);
  const toggleShowArchived = useCallback(() => {
    setShowArchived((prev) => !prev);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Expanded/collapsed client state
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  const [pendingUpdates, setPendingUpdates] = useState<{
    tags: Map<string, boolean>;
    folders: Map<string, boolean>;
  }>({
    tags: new Map(),
    folders: new Map(),
  });

  const debounceRef = useRef<number | null>(null);

  // React Query: fetch tree
  const {
    data: tagTree = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["tagTree"],
    queryFn: () => fetchTagTree(getToken),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: (failureCount) => failureCount < 3,
    retryDelay: (i) => Math.min(1000 * 2 ** i, 30000),
  });

  function filterPages(pages: TreePage[], showArchived: boolean): TreePage[] {
    return pages.filter((page) => page.archived === showArchived);
  }

  function filterFolders(
    folders: TreeFolder[],
    showArchived: boolean
  ): TreeFolder[] {
    return folders.map((folder) => ({
      ...folder,
      pages: filterPages(folder.pages, showArchived),
      subFolders: filterFolders(folder.subFolders, showArchived),
    }));
  }

  function filterTagTree(tags: TreeTag[], showArchived: boolean): TreeTag[] {
    return tags.map((tag) => ({
      ...tag,
      pages: filterPages(tag.pages, showArchived),
      folders: filterFolders(tag.folders, showArchived),
      children: filterTagTree(tag.children, showArchived),
    }));
  }

  // Update the filteredTagTree calculation in useTagTree:
  const filteredTagTree = useMemo(() => {
    return filterTagTree(tagTree, showArchived);
  }, [tagTree, showArchived]);

  // ---------------
  // React Query mutation for batching
  const batchUpdateMutation = useMutation({
    mutationFn: (updates: BatchUpdateRequest) =>
      batchUpdateCollapsedState(updates, getToken),
    onSuccess: () => setPendingUpdates({ tags: new Map(), folders: new Map() }),
    onError: (err) =>
      Sentry.captureException(err, {
        tags: { component: "useTagTree", action: "batchUpdate" },
      }),
  });

  const debouncedSync = useCallback(() => {
    if (debounceRef.current != null) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const { tags, folders } = pendingUpdates;
      if (tags.size || folders.size) {
        batchUpdateMutation.mutate({
          tags: Array.from(tags.entries()).map(([id, isCollapsed]) => ({
            id,
            isCollapsed,
          })),
          folders: Array.from(folders.entries()).map(([id, isCollapsed]) => ({
            id,
            isCollapsed,
          })),
        });
      }
    }, 1000) as unknown as number;
  }, [pendingUpdates, batchUpdateMutation]);

  const toggleTag = useCallback(
    (tagId: string) => {
      setExpandedTags((prev) => {
        const newSet = new Set(prev);
        const wasExpanded = newSet.has(tagId);
        wasExpanded ? newSet.delete(tagId) : newSet.add(tagId);
        setPendingUpdates((cur) => ({
          ...cur,
          tags: new Map(cur.tags).set(tagId, wasExpanded),
        }));
        debouncedSync();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return newSet;
      });
    },
    [debouncedSync]
  );

  const toggleFolder = useCallback(
    (folderId: string) => {
      setExpandedFolders((prev) => {
        const newSet = new Set(prev);
        const wasExpanded = newSet.has(folderId);
        wasExpanded ? newSet.delete(folderId) : newSet.add(folderId);
        setPendingUpdates((cur) => ({
          ...cur,
          folders: new Map(cur.folders).set(folderId, wasExpanded),
        }));
        debouncedSync();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return newSet;
      });
    },
    [debouncedSync]
  );

  const isTagExpanded = useCallback(
    (tagId: string) => expandedTags.has(tagId),
    [expandedTags]
  );
  const isFolderExpanded = useCallback(
    (folderId: string) => expandedFolders.has(folderId),
    [expandedFolders]
  );

  const forceSyncPendingUpdates = useCallback(() => {
    if (debounceRef.current != null) clearTimeout(debounceRef.current);
    const { tags, folders } = pendingUpdates;
    if (tags.size || folders.size) {
      batchUpdateMutation.mutate({
        tags: Array.from(tags.entries()).map(([id, isCollapsed]) => ({
          id,
          isCollapsed,
        })),
        folders: Array.from(folders.entries()).map(([id, isCollapsed]) => ({
          id,
          isCollapsed,
        })),
      });
    }
  }, [pendingUpdates, batchUpdateMutation]);

  // cleanup
  useEffect(
    () => () => {
      if (debounceRef.current != null) clearTimeout(debounceRef.current);
    },
    []
  );

  // initialize expanded state from server
  useEffect(() => {
    if (tagTree.length) {
      const t = new Set<string>(),
        f = new Set<string>();
      const init = (tags: TreeTag[]) =>
        tags.forEach((tag) => {
          if (!tag.is_collapsed) t.add(tag.id);
          tag.folders.forEach((folder) => {
            if (!folder.is_collapsed) f.add(folder.id);
            const proc = (subs: TreeFolder[]) =>
              subs.forEach((sf) => {
                if (!sf.is_collapsed) f.add(sf.id);
                proc(sf.subFolders);
              });
            proc(folder.subFolders);
          });
          init(tag.children);
        });
      init(tagTree);
      setExpandedTags(t);
      setExpandedFolders(f);
    }
  }, [tagTree]);

  return {
    tagTree,
    filteredTagTree,
    isLoading,
    error,
    refetch,
    showArchived,
    toggleShowArchived,
    toggleTag,
    toggleFolder,
    isTagExpanded,
    isFolderExpanded,
    isUpdating: batchUpdateMutation.isPending,
    hasPendingUpdates:
      !!pendingUpdates.tags.size || !!pendingUpdates.folders.size,
    forceSyncPendingUpdates,
  };
};
