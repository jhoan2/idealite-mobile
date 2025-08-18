// app/(tabs)/workspace/pages/index.tsx - Updated with search functionality
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { FileText, Plus, Search, Wifi, WifiOff, X } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDebouncedCallback } from "use-debounce";
import { Page, PageItem } from "../../../../components/page/PageItem";
import { pageRepository } from "../../../../db/pageRepository";
import {
  useLastSyncTimestamp,
  useNetworkStatus,
  useQueueLength,
  useSyncStatus,
  useSyncStore,
} from "../../../../store/syncStore";

const PAGES_PER_LOAD = 100; // Number of pages to load at once

export default function AllPagesScreen() {
  const insets = useSafeAreaInsets();

  // Pagination state
  const [pages, setPages] = useState<Page[]>([]);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMorePages, setHasMorePages] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Page[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);

  // Sync store state
  const isOnline = useNetworkStatus();
  const syncStatus = useSyncStatus();
  const queueLength = useQueueLength();
  const lastSyncTimestamp = useLastSyncTimestamp();
  const { performFullSync, pullFromServer } = useSyncStore();

  // Debounced search function
  const debouncedSearch = useDebouncedCallback(async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      setIsSearchMode(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setIsSearchMode(true);

    try {
      const results = await pageRepository.searchPages(query, 100);
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      Alert.alert("Search Error", "Failed to search pages");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, 300);

  // Handle search input change
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);

    if (text.length === 0) {
      setSearchResults([]);
      setIsSearchMode(false);
      setIsSearching(false);
      return;
    }

    debouncedSearch(text);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setIsSearchMode(false);
    setIsSearching(false);
  };

  // Load initial pages
  const loadInitialPages = useCallback(async () => {
    try {
      setLoading(true);
      const pagesFromDB = await pageRepository.getActivePages(
        PAGES_PER_LOAD,
        0
      );
      setPages(pagesFromDB);
      setCurrentOffset(PAGES_PER_LOAD);
      setHasMorePages(pagesFromDB.length === PAGES_PER_LOAD);
    } catch (error) {
      console.error("Error loading initial pages:", error);
      Alert.alert("Error", "Failed to load pages");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more pages for infinite scroll (only for non-search mode)
  const loadMorePages = useCallback(async () => {
    if (loadingMore || !hasMorePages || isSearchMode) return;

    try {
      setLoadingMore(true);
      const morePagesFromDB = await pageRepository.getActivePages(
        PAGES_PER_LOAD,
        currentOffset
      );

      if (morePagesFromDB.length > 0) {
        setPages((prevPages) => [...prevPages, ...morePagesFromDB]);
        setCurrentOffset((prev) => prev + PAGES_PER_LOAD);
        setHasMorePages(morePagesFromDB.length === PAGES_PER_LOAD);
      } else {
        setHasMorePages(false);
      }
    } catch (error) {
      console.error("Error loading more pages:", error);
      Alert.alert("Error", "Failed to load more pages");
    } finally {
      setLoadingMore(false);
    }
  }, [currentOffset, loadingMore, hasMorePages, isSearchMode]);

  // Handle pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      if (isOnline) {
        await performFullSync();
      }

      // Reset pagination and reload from beginning
      setCurrentOffset(0);
      setHasMorePages(true);
      await loadInitialPages();

      // If we're in search mode, re-run the search
      if (isSearchMode && searchQuery.length >= 3) {
        const results = await pageRepository.searchPages(searchQuery, 100);
        setSearchResults(results);
      }
    } catch (error) {
      console.error("Refresh error:", error);
      Alert.alert("Sync Error", "Failed to sync with server");
    } finally {
      setRefreshing(false);
    }
  }, [isOnline, performFullSync, loadInitialPages, isSearchMode, searchQuery]);

  // Create new page
  const createNewPage = async () => {
    try {
      const newPage = await pageRepository.createPageWithUniqueTitle(
        "Untitled Page",
        {
          content: "<p>Start writing...</p>",
          content_type: "page",
          description: null,
          image_previews: null,
          deleted: false,
        }
      );

      router.push({
        pathname: "/workspace/pages/[id]",
        params: { id: newPage.id.toString() },
      });

      // Refresh to show the new page at the top
      await loadInitialPages();
    } catch (error) {
      console.error("Error creating page:", error);
      Alert.alert("Error", "Failed to create page");
    }
  };

  const openPage = (page: Page) => {
    router.push({
      pathname: "/workspace/pages/[id]",
      params: { id: page.id.toString() },
    });
  };

  // Page item component for FlashList
  const renderPageItem = ({ item }: { item: Page }) => (
    <PageItem item={item} onPress={openPage} />
  );

  // Footer component for loading more indicator
  const renderFooter = () => {
    if (!loadingMore || isSearchMode) return null;

    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color="#3b82f6" />
        <Text className="text-gray-500 text-sm mt-2">
          Loading more pages...
        </Text>
      </View>
    );
  };

  // Empty state component
  const EmptyState = () => {
    if (isSearchMode) {
      return (
        <View className="flex-1 justify-center items-center px-8 py-20">
          <Search size={64} color="#d1d5db" />
          <Text className="text-gray-900 text-xl font-semibold mt-4 mb-2">
            No results found
          </Text>
          <Text className="text-gray-500 text-center mb-4">
            No pages match "{searchQuery}". Try different keywords.
          </Text>
          <TouchableOpacity
            onPress={clearSearch}
            className="bg-blue-500 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-medium">Clear search</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
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
  };

  // Determine which data to show
  const displayData = isSearchMode ? searchResults : pages;
  const showLoadMore = !isSearchMode && hasMorePages;

  // Initial load and sync setup
  useEffect(() => {
    loadInitialPages();

    // Trigger initial sync if online
    if (isOnline) {
      setTimeout(() => {
        if (queueLength > 0) {
          useSyncStore
            .getState()
            .processQueue()
            .then(() => loadInitialPages());
        } else {
          pullFromServer().then(() => loadInitialPages());
        }
      }, 1000);
    }
  }, [loadInitialPages, isOnline, queueLength, pullFromServer]);

  // Loading state for initial load
  if (loading && pages.length === 0 && !isSearchMode) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-600 mt-4">Loading your pages...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Search Bar */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
          <Search size={20} color="#9ca3af" />
          <TextInput
            value={searchQuery}
            onChangeText={handleSearchChange}
            placeholder="Search pages..."
            placeholderTextColor="#9ca3af"
            className="flex-1 ml-2 text-gray-900 text-base"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} className="ml-2">
              <X size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
          {isSearching && (
            <ActivityIndicator
              size="small"
              color="#3b82f6"
              style={{ marginLeft: 8 }}
            />
          )}
        </View>
      </View>

      {/* Status Bar */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center justify-between">
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

            {lastSyncTimestamp && (
              <Text className="text-gray-400 text-xs ml-4">
                Last sync: {new Date(lastSyncTimestamp).toLocaleTimeString()}
              </Text>
            )}
          </View>

          <View className="flex-row items-center">
            {isSearchMode && (
              <Text className="text-blue-600 text-sm mr-4">
                {searchResults.length} result
                {searchResults.length !== 1 ? "s" : ""}
              </Text>
            )}

            {queueLength > 0 && (
              <View className="bg-blue-100 px-2 py-1 rounded-full">
                <Text className="text-blue-600 text-xs font-medium">
                  {queueLength} pending
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Pages List */}
      <FlashList
        data={displayData}
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
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        disableAutoLayout={false}
        // Only enable infinite scroll for non-search mode
        onEndReached={showLoadMore ? loadMorePages : undefined}
        onEndReachedThreshold={showLoadMore ? 0.1 : undefined}
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
