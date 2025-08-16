// stores/syncStore.ts - Enhanced queue-based sync store with pull functionality
import * as Network from "expo-network";
import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { captureAndFormatError } from "../lib/sentry/errorHandler";

// ================================
// Types
// ================================

export type SyncOperationType = "create" | "update" | "delete";

export interface SyncOperation {
  id: string; // UUID for operation tracking
  operationType: SyncOperationType;
  localId: number; // Local page ID
  serverId?: string | null; // Server page ID
  data: any;
  timestamp: string;
  retryCount: number;
}

export type SyncStatus = "idle" | "syncing" | "error";

// ================================
// Store Interface
// ================================

interface SyncStore {
  // Network & Status
  isOnline: boolean;
  status: SyncStatus;

  // Queue Management (not persistent)
  operationQueue: SyncOperation[];
  processingOperation: SyncOperation | null;

  // Pull Sync Properties
  lastSyncTimestamp: string | null;
  pullInProgress: boolean;

  // Statistics
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  lastSyncAt: string | null;

  // Settings
  autoSyncEnabled: boolean;
  batchSize: number;
  maxRetries: number;

  // ================================
  // Actions
  // ================================

  // Initialization
  initialize: () => Promise<() => void>; // Returns cleanup function

  // Network
  setNetworkStatus: (isOnline: boolean) => void;

  // Queue Operations
  queueOperation: (
    operation: Omit<SyncOperation, "id" | "timestamp" | "retryCount">
  ) => void;
  clearQueue: () => void;
  removeOperation: (operationId: string) => void;

  // Sync Execution
  processQueue: () => Promise<void>;
  forceSyncAll: () => Promise<void>;

  // Pull Sync Methods
  pullFromServer: () => Promise<void>;
  performFullSync: () => Promise<void>;
  setLastSyncTimestamp: (timestamp: string) => void;

  // Utilities
  getQueueLength: () => number;
  retryFailedOperations: () => Promise<void>;

  // Settings
  updateSettings: (
    settings: Partial<
      Pick<SyncStore, "autoSyncEnabled" | "batchSize" | "maxRetries">
    >
  ) => void;

  // Debug
  reset: () => void;
  exportState: () => any;

  // ================================
  // Private Methods (should be overridden by provider)
  // ================================
  _executeOperation: (operation: SyncOperation) => Promise<void>;
  _handleOperationError: (
    operation: SyncOperation,
    error: any
  ) => Promise<void>;
  _syncService: any; // Will be set by provider
}

// ================================
// Store Implementation
// ================================

export const useSyncStore = create<SyncStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial State
        isOnline: true,
        status: "idle",
        operationQueue: [],
        processingOperation: null,
        lastSyncTimestamp: null,
        pullInProgress: false,
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        lastSyncAt: null,
        autoSyncEnabled: true,
        batchSize: 10,
        maxRetries: 3,
        _syncService: null,

        // ================================
        // Initialization
        // ================================
        initialize: async () => {
          try {
            // Get initial network state
            const networkState = await Network.getNetworkStateAsync();
            get().setNetworkStatus(networkState.isConnected ?? false);

            // Set up network listener
            const subscription = Network.addNetworkStateListener((state) => {
              const wasOffline = !get().isOnline;
              get().setNetworkStatus(state.isConnected ?? false);

              // If we just came back online, start syncing
              if (wasOffline && state.isConnected && get().autoSyncEnabled) {
                setTimeout(() => get().processQueue(), 500);
              }
            });

            // Return cleanup function
            return () => {
              subscription.remove();
            };
          } catch (error) {
            captureAndFormatError(error, {
              operation: "sync store initialization",
              component: "SyncStore",
              level: "error",
            });
            return () => {}; // Return no-op cleanup
          }
        },

        // ================================
        // Network Management
        // ================================
        setNetworkStatus: (isOnline: boolean) => {
          set((state) => {
            state.isOnline = isOnline;
          });
        },

        // ================================
        // Queue Management
        // ================================
        queueOperation: (operation) => {
          set((state) => {
            // Check if there's already a pending operation for this page
            const existingIndex = state.operationQueue.findIndex(
              (op: SyncOperation) => op.localId === operation.localId
            );

            const newOperation: SyncOperation = {
              ...operation,
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              timestamp: new Date().toISOString(),
              retryCount: 0,
            };

            if (existingIndex !== -1) {
              // Replace existing operation (merge edits)
              state.operationQueue[existingIndex] = newOperation;
            } else {
              // Add new operation
              state.operationQueue.push(newOperation);
              state.totalOperations += 1;
            }
          });

          // Auto-process if enabled and online
          if (
            get().autoSyncEnabled &&
            get().isOnline &&
            get().status === "idle"
          ) {
            setTimeout(() => get().processQueue(), 100);
          }
        },

        clearQueue: () => {
          set((state) => {
            state.operationQueue = [];
          });
        },

        removeOperation: (operationId: string) => {
          set((state) => {
            const index = state.operationQueue.findIndex(
              (op: SyncOperation) => op.id === operationId
            );
            if (index !== -1) {
              state.operationQueue.splice(index, 1);
            }
          });
        },

        // ================================
        // Sync Execution
        // ================================
        processQueue: async () => {
          const { isOnline, status, operationQueue, batchSize } = get();

          if (
            !isOnline ||
            status === "syncing" ||
            operationQueue.length === 0
          ) {
            return;
          }

          set((state) => {
            state.status = "syncing";
          });

          try {
            // Process operations in batches
            const batch = operationQueue.slice(0, batchSize);

            for (const operation of batch) {
              set((state) => {
                state.processingOperation = operation;
              });

              try {
                await get()._executeOperation(operation);

                // Remove successful operation
                get().removeOperation(operation.id);

                set((state) => {
                  state.successfulOperations += 1;
                  state.lastSyncAt = new Date().toISOString();
                });
              } catch (error) {
                await get()._handleOperationError(operation, error);
              }
            }

            // Continue processing if there are more operations
            if (get().operationQueue.length > 0) {
              setTimeout(() => get().processQueue(), 1000);
            } else {
              // After all push operations are done, trigger a pull
              setTimeout(() => get().pullFromServer(), 500);

              set((state) => {
                state.status = "idle";
                state.processingOperation = null;
              });
            }
          } catch (error) {
            set((state) => {
              state.status = "error";
              state.processingOperation = null;
            });

            captureAndFormatError(error, {
              operation: "process sync queue",
              component: "SyncStore",
              level: "error",
            });
          }
        },

        forceSyncAll: async () => {
          if (get().status === "syncing") return;

          set((state) => {
            state.status = "syncing";
          });

          try {
            await get().processQueue();
          } catch (error) {
            set((state) => {
              state.status = "error";
            });
            throw error;
          }
        },

        // ================================
        // Pull Sync Methods
        // ================================
        pullFromServer: async () => {
          const { isOnline, status, _syncService } = get();

          if (!isOnline || status === "syncing" || !_syncService) {
            return;
          }

          set((state) => {
            state.status = "syncing";
            state.pullInProgress = true;
          });

          try {
            const lastSync = get().lastSyncTimestamp;
            const pulledCount = await _syncService.pullFromServer(
              lastSync || undefined
            );

            set((state) => {
              state.lastSyncAt = new Date().toISOString();
              state.lastSyncTimestamp = new Date().toISOString();
              state.status = "idle";
              state.pullInProgress = false;
            });

            console.log(`Pulled ${pulledCount} pages from server`);
          } catch (error) {
            set((state) => {
              state.status = "error";
              state.pullInProgress = false;
            });

            captureAndFormatError(error, {
              operation: "pull from server",
              component: "SyncStore",
              level: "error",
            });
          }
        },

        performFullSync: async () => {
          const { isOnline, status, _syncService } = get();

          if (!isOnline || status === "syncing" || !_syncService) {
            return;
          }

          set((state) => {
            state.status = "syncing";
          });

          try {
            const lastSync = get().lastSyncTimestamp;
            const result = await _syncService.performFullSync(
              lastSync || undefined
            );

            set((state) => {
              state.lastSyncAt = new Date().toISOString();
              state.lastSyncTimestamp = new Date().toISOString();
              state.status = "idle";
              state.successfulOperations += result.pushedOperations;
            });

            console.log(`Full sync completed:`, result);

            // Log any errors that occurred during sync
            if (result.errors.length > 0) {
              result.errors.forEach((error: unknown) => {
                const errorObject =
                  error instanceof Error ? error : new Error(String(error));
                captureAndFormatError(errorObject, {
                  operation: "full sync",
                  component: "SyncStore",
                  level: "warning",
                });
              });
            }
          } catch (error) {
            set((state) => {
              state.status = "error";
            });

            captureAndFormatError(error, {
              operation: "perform full sync",
              component: "SyncStore",
              level: "error",
            });
          }
        },

        setLastSyncTimestamp: (timestamp: string) => {
          set((state) => {
            state.lastSyncTimestamp = timestamp;
          });
        },

        // ================================
        // Utilities
        // ================================
        getQueueLength: () => {
          return get().operationQueue.length;
        },

        retryFailedOperations: async () => {
          // Reset retry counts and try again
          set((state) => {
            state.operationQueue.forEach((op: SyncOperation) => {
              op.retryCount = 0;
            });
          });

          if (get().isOnline) {
            await get().processQueue();
          }
        },

        // ================================
        // Settings
        // ================================
        updateSettings: (settings) => {
          set((state) => {
            Object.assign(state, settings);
          });
        },

        // ================================
        // Debug
        // ================================
        reset: () => {
          set((state) => {
            state.operationQueue = [];
            state.processingOperation = null;
            state.status = "idle";
            state.pullInProgress = false;
            state.totalOperations = 0;
            state.successfulOperations = 0;
            state.failedOperations = 0;
            state.lastSyncAt = null;
            state.lastSyncTimestamp = null;
          });
        },

        exportState: () => {
          const state = get();
          return {
            status: state.status,
            queueLength: state.operationQueue.length,
            totalOperations: state.totalOperations,
            successfulOperations: state.successfulOperations,
            failedOperations: state.failedOperations,
            lastSyncAt: state.lastSyncAt,
            lastSyncTimestamp: state.lastSyncTimestamp,
            pullInProgress: state.pullInProgress,
            isOnline: state.isOnline,
          };
        },

        // ================================
        // Private Methods (to be overridden by provider)
        // ================================
        _executeOperation: async (operation: SyncOperation) => {
          throw new Error("_executeOperation not implemented");
        },

        _handleOperationError: async (operation: SyncOperation, error: any) => {
          const maxRetries = get().maxRetries;

          if (operation.retryCount < maxRetries && get().isOnline) {
            // Retry with exponential backoff
            operation.retryCount += 1;
            const delay = Math.min(
              1000 * Math.pow(2, operation.retryCount),
              10000
            );

            setTimeout(async () => {
              try {
                await get()._executeOperation(operation);

                // Remove successful operation
                get().removeOperation(operation.id);

                set((state) => {
                  state.successfulOperations += 1;
                  state.lastSyncAt = new Date().toISOString();
                });
              } catch (retryError) {
                await get()._handleOperationError(operation, retryError);
              }
            }, delay);
          } else {
            // Max retries reached or offline - remove operation
            get().removeOperation(operation.id);

            set((state) => {
              state.failedOperations += 1;
              state.status = "error";
            });

            captureAndFormatError(error, {
              operation: `sync ${operation.operationType} page`,
              component: "SyncStore",
              context: {
                pageId: operation.localId,
                retryCount: operation.retryCount,
              },
            });
          }
        },
      }))
    ),
    { name: "sync-store" }
  )
);

// ================================
// Selector Hooks
// ================================
export const useNetworkStatus = () => useSyncStore((state) => state.isOnline);
export const useSyncStatus = () => useSyncStore((state) => state.status);
export const useQueueLength = () =>
  useSyncStore((state) => state.operationQueue.length);
export const useLastSyncTimestamp = () =>
  useSyncStore((state) => state.lastSyncTimestamp);
export const usePullInProgress = () =>
  useSyncStore((state) => state.pullInProgress);
