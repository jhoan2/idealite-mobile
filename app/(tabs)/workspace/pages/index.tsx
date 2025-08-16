// app/(tabs)/workspace/index.tsx - Updated with extracted PageItem component
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { FileText, Plus, Wifi, WifiOff } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Page, PageItem } from "../../../../components/page/PageItem";
import { pageRepository } from "../../../../db/pageRepository";
import {
  useLastSyncTimestamp,
  useNetworkStatus,
  useQueueLength,
  useSyncStatus,
  useSyncStore,
} from "../../../../store/syncStore";

export default function AllPagesScreen() {
  const insets = useSafeAreaInsets();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Sync store state - updated with new methods
  const isOnline = useNetworkStatus();
  const syncStatus = useSyncStatus();
  const queueLength = useQueueLength();
  const lastSyncTimestamp = useLastSyncTimestamp();
  const { performFullSync, pullFromServer } = useSyncStore();

  // Load pages from local database - updated to use real database
  const loadPages = useCallback(async () => {
    try {
      setLoading(true);
      const pagesFromDB = await pageRepository.getActivePages();
      setPages(pagesFromDB);
    } catch (error) {
      console.error("Error loading pages:", error);
      Alert.alert("Error", "Failed to load pages");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load and trigger sync - updated with real sync logic
  useEffect(() => {
    loadPages();

    // Trigger initial sync if online
    if (isOnline) {
      // Use setTimeout to avoid blocking the UI
      setTimeout(() => {
        if (queueLength > 0) {
          // If there are pending operations, just process the queue
          // (which will trigger a pull after push completes)
          console.log("Processing pending sync operations...");
        } else {
          // If no pending operations, do a pull to get latest from server
          pullFromServer().then(() => {
            // Reload pages after pull
            loadPages();
          });
        }
      }, 1000);
    }
  }, [loadPages, isOnline, queueLength, pullFromServer]);

  // Handle pull to refresh - updated with real sync methods
  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      if (isOnline) {
        // Perform full sync (push local changes, then pull updates)
        await performFullSync();
      }

      // Reload local pages
      await loadPages();
    } catch (error) {
      console.error("Refresh error:", error);
      Alert.alert("Sync Error", "Failed to sync with server");
    } finally {
      setRefreshing(false);
    }
  }, [isOnline, performFullSync, loadPages]);

  const createNewPage = () => {
    const newPageId = Date.now();
    router.push({
      pathname: "/workspace/pages/[id]",
      params: {
        id: newPageId.toString(),
        isNew: "true",
      },
    });
  };

  const openPage = (page: Page) => {
    router.push({
      pathname: "/workspace/pages/[id]",
      params: {
        id: page.id.toString(),
      },
    });
  };

  // Page item component for FlashList
  const renderPageItem = ({ item }: { item: Page }) => (
    <PageItem item={item} onPress={openPage} />
  );

  // Empty state component
  const EmptyState = () => (
    <View className="flex-1 justify-center items-center px-8 py-20">
      <FileText size={64} color="#d1d5db" />
      <Text className="text-gray-900 text-xl font-semibold mt-4 mb-2">
        No pages yet
      </Text>
      <Text className="text-gray-500 text-center mb-8">
        Create your first page to get started with Idealite
      </Text>
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-600 mt-4">Loading your pages...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Status Bar - updated with last sync timestamp */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center justify-between">
          {/* Network and sync status */}
          <View className="flex-row items-center">
            {isOnline ? (
              <Wifi size={16} color="#10b981" />
            ) : (
              <WifiOff size={16} color="#ef4444" />
            )}
            <Text
              className={`ml-2 text-sm font-medium ${
                isOnline ? "text-green-600" : "text-red-600"
              }`}
            >
              {isOnline ? "Online" : "Offline"}
            </Text>

            {syncStatus === "syncing" && (
              <View className="flex-row items-center ml-4">
                <ActivityIndicator size="small" color="#f59e0b" />
                <Text className="text-orange-600 text-sm ml-2">Syncing...</Text>
              </View>
            )}

            {/* Last sync timestamp display */}
            {lastSyncTimestamp && (
              <Text className="text-gray-400 text-xs ml-4">
                Last sync: {new Date(lastSyncTimestamp).toLocaleTimeString()}
              </Text>
            )}
          </View>

          {/* Queue indicator */}
          {queueLength > 0 && (
            <View className="bg-blue-100 px-2 py-1 rounded-full">
              <Text className="text-blue-600 text-xs font-medium">
                {queueLength} pending
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Pages List - Fixed FlashList implementation */}
      <FlashList
        data={pages}
        renderItem={renderPageItem}
        keyExtractor={(item) => item.id.toString()}
        estimatedItemSize={120}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: insets.bottom + 100,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3b82f6"]}
            tintColor="#3b82f6"
          />
        }
        ListEmptyComponent={EmptyState}
        showsVerticalScrollIndicator={false}
        disableAutoLayout={false}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={createNewPage}
        className="absolute bottom-6 right-6 bg-blue-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
        }}
        activeOpacity={0.8}
      >
        <Plus size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}
