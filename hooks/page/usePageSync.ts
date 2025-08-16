// ================================
// Page-specific Hooks
// ================================

// hooks/page/usePageSync.ts
import { useCallback } from "react";
import { useSyncStore } from "../../store/syncStore";

export function usePageSync(pageId: number, serverId?: string | null) {
  const syncStore = useSyncStore();

  const queuePageUpdate = useCallback(
    (updates: { title?: string; content?: string }) => {
      syncStore.queueOperation({
        operationType: "update",
        localId: pageId,
        serverId: serverId || null,
        data: {
          ...updates,
          updated_at: new Date().toISOString(),
        },
      });
    },
    [pageId, serverId, syncStore]
  );

  const queuePageCreate = useCallback(
    (data: any) => {
      syncStore.queueOperation({
        operationType: "create",
        localId: pageId,
        serverId: null,
        data,
      });
    },
    [pageId, syncStore]
  );

  const queuePageDelete = useCallback(() => {
    syncStore.queueOperation({
      operationType: "delete",
      localId: pageId,
      serverId: serverId || null,
      data: {
        deleted: true,
        updated_at: new Date().toISOString(),
      },
    });
  }, [pageId, serverId, syncStore]);

  return {
    queuePageUpdate,
    queuePageCreate,
    queuePageDelete,
    canSync: syncStore.autoSyncEnabled && syncStore.isOnline,
  };
}
