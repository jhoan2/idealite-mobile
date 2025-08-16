// ================================
// Provider
// ================================

// providers/SyncProvider.tsx
import { useAuth } from "@clerk/clerk-expo";
import React, { useEffect } from "react";
import { SyncService } from "../services/syncService";
import { useSyncStore } from "../store/syncStore";

interface SyncProviderProps {
  children: React.ReactNode;
}

export function SyncProvider({ children }: SyncProviderProps) {
  const { getToken } = useAuth();
  const initializeSync = useSyncStore((state) => state.initialize);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    // Initialize the sync store
    initializeSync().then((cleanupFn) => {
      cleanup = cleanupFn;
    });

    // Set up the sync service
    const syncService = new SyncService(
      process.env.EXPO_PUBLIC_API_URL!,
      getToken
    );

    // Register sync handler with the store
    useSyncStore.setState((state) => {
      state._executeOperation = syncService.executeOperation.bind(syncService);
      state._syncService = syncService;
    });

    return () => {
      cleanup?.();
    };
  }, [initializeSync, getToken]);

  return <>{children}</>;
}
