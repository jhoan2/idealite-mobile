// app/(tabs)/notifications/index.tsx
import * as Sentry from "@sentry/react-native";
import React, { useCallback, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ErrorScreen } from "../../../components/ErrorScreen";
import { NotificationItem } from "../../../components/notifications/NotificationItem";
import { NotificationsEmptyState } from "../../../components/notifications/NotificationsEmptyState";
import {
  useInfiniteNotifications,
  useMarkNotificationsAsRead,
  type Notification,
} from "../../../hooks/notifications/useNotifications";
import { useUndoAction } from "../../../hooks/notifications/useUndoActions";

export default function NotificationsScreen() {
  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteNotifications(10);

  const markAsReadMutation = useMarkNotificationsAsRead();
  const undoMutation = useUndoAction();
  const unreadNotificationIds = useRef<Set<string>>(new Set());

  // Flatten all pages of notifications
  const notifications = data?.pages.flatMap((page) => page.data) || [];

  // Handle notification press
  const handleNotificationPress = useCallback((notification: Notification) => {
    try {
      // TODO: Handle navigation to specific notification details or related content
      console.log("Notification pressed:", notification.title);
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          component: "NotificationsScreen",
          action: "notification_press",
        },
      });
    }
  }, []);

  // Handle viewable items changed (mark as read when in view)
  const handleViewableItemsChanged = useCallback(
    ({
      viewableItems,
    }: {
      viewableItems: Array<{ item: Notification; isViewable: boolean }>;
    }) => {
      try {
        const unreadViewableItems = viewableItems.filter(
          ({ item, isViewable }) => isViewable && item.status === "unread"
        );

        if (unreadViewableItems.length > 0) {
          unreadViewableItems.forEach(({ item }) => {
            unreadNotificationIds.current.add(item.id);
          });

          // Debounce the API call to batch mark as read
          setTimeout(() => {
            const idsToMark = Array.from(unreadNotificationIds.current);
            if (idsToMark.length > 0) {
              markAsReadMutation.mutate(idsToMark);
              unreadNotificationIds.current.clear();
            }
          }, 500); // Shorter delay since it's based on viewing
        }
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            component: "NotificationsScreen",
            action: "viewable_items_changed",
          },
        });
      }
    },
    [markAsReadMutation]
  );

  // Viewability config - similar to web's intersection observer
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50, // 50% of item must be visible
    waitForInteraction: false,
  }).current;

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    try {
      await refetch();
    } catch (error) {
      Sentry.captureException(error, {
        tags: { component: "NotificationsScreen", action: "refresh" },
      });
    }
  }, [refetch]);

  // Load more notifications when reaching end
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Render notification item
  const renderNotificationItem = useCallback(
    ({ item }: { item: Notification }) => (
      <NotificationItem
        notification={item}
        onPress={handleNotificationPress}
        undoMutation={undoMutation}
      />
    ),
    [handleNotificationPress, undoMutation]
  );

  // Render footer loading indicator
  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;

    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color="#18181b" />
        <Text className="text-muted-foreground text-sm mt-2">
          Loading more notifications...
        </Text>
      </View>
    );
  }, [isFetchingNextPage]);

  // Render end message
  const renderEndMessage = useCallback(() => {
    if (hasNextPage || notifications.length === 0) return null;

    return (
      <View className="py-6 items-center">
        <Text className="text-muted-foreground text-sm">
          You've reached the end of your notifications
        </Text>
      </View>
    );
  }, [hasNextPage, notifications.length]);

  // Show error state
  if (error && !isRefetching) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <ErrorScreen
          message={error.message || "Failed to load notifications"}
          onRetry={onRefresh}
        />
      </SafeAreaView>
    );
  }

  const hasNotifications = notifications.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      {/* Content */}
      {isLoading && !isRefetching ? (
        // Initial loading state
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#18181b" />
          <Text className="text-muted-foreground mt-4">
            Loading notifications...
          </Text>
        </View>
      ) : hasNotifications ? (
        // Notifications list with infinite scroll
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              tintColor="#18181b"
              colors={["#18181b"]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          ListFooterComponent={
            <View>
              {renderFooter()}
              {renderEndMessage()}
            </View>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
          // Performance optimizations for infinite scroll
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={10}
        />
      ) : (
        // Empty state
        <View className="flex-1">
          <FlatList
            data={[]}
            renderItem={() => null}
            ListEmptyComponent={<NotificationsEmptyState />}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={onRefresh}
                tintColor="#18181b"
                colors={["#18181b"]}
              />
            }
            contentContainerStyle={{ flexGrow: 1 }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}
