// hooks/useSync.ts
import { useAuth } from "@clerk/clerk-expo";
import * as Network from "expo-network";
import { useCallback, useEffect, useState } from "react";
import { captureAndFormatError } from "../../lib/sentry/errorHandler";
import { SyncResult, SyncService } from "../../services/syncService";

export function useSync() {
  const { getToken } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  // Create sync service instance
  const syncService = new SyncService(
    process.env.EXPO_PUBLIC_API_URL!,
    getToken
  );

  // Check network status
  useEffect(() => {
    const checkNetworkStatus = async () => {
      try {
        const networkState = await Network.getNetworkStateAsync();
        setIsOnline(networkState.isConnected === true);
      } catch (error) {
        // Log network check errors but don't break the app
        captureAndFormatError(error, {
          operation: "check network status",
          component: "useSync",
          level: "warning",
        });
        // Assume offline if we can't check
        setIsOnline(false);
      }
    };

    checkNetworkStatus();

    // Check every 30 seconds
    const interval = setInterval(checkNetworkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Manual sync trigger
  const triggerSync = useCallback(async () => {
    if (isSyncing || !isOnline) return;

    setIsSyncing(true);
    try {
      const result = await syncService.syncAll();
      setLastSyncResult(result);
      return result;
    } catch (error) {
      const errorMessage = captureAndFormatError(error, {
        operation: "trigger sync",
        component: "useSync",
        level: "error",
        context: { isOnline, apiUrl: process.env.EXPO_PUBLIC_API_URL },
      });

      const errorResult: SyncResult = {
        success: false,
        uploadedPages: 0,
        downloadedPages: 0,
        errors: [errorMessage],
      };
      setLastSyncResult(errorResult);
      return errorResult;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, isOnline, syncService]);

  // Auto-sync when app becomes active (if online)
  useEffect(() => {
    if (isOnline && !isSyncing) {
      // Debounce auto-sync
      const timer = setTimeout(() => {
        triggerSync();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  return {
    isSyncing,
    isOnline,
    lastSyncResult,
    triggerSync,
  };
}
