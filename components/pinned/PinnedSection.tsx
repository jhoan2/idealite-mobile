// components/pinned/PinnedSection.tsx - Updated with react-native-draggable-flatlist
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";
import DraggableFlatList, {
  RenderItemParams,
} from "react-native-draggable-flatlist";
import { pageRepository } from "../../db/pageRepository";
import {
  PinnedPage,
  usePinnedPages,
  useReorderPinnedPages,
} from "../../hooks/pinned/usePinnedPages";
import { DraggablePinnedItem } from "./DraggablePinnedItem";

interface PinnedSectionProps {
  onItemPress?: () => void;
}

export function PinnedSection({ onItemPress }: PinnedSectionProps) {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);

  const {
    data: pinnedPages = [],
    isLoading,
    error,
    refetch,
  } = usePinnedPages();

  const reorderMutation = useReorderPinnedPages();

  const handleItemPress = useCallback(
    async (serverPageId: string) => {
      if (isDragging) return; // Don't navigate while dragging

      try {
        // Look up the local page using server ID
        const localPage = await pageRepository.findByServerId(serverPageId);

        if (!localPage) {
          Alert.alert(
            "Page Not Found",
            "This page hasn't been synced to your device yet. Please try syncing first.",
            [{ text: "OK" }]
          );
          return;
        }

        // Call the optional callback
        onItemPress?.();

        // Navigate using the correct local ID
        router.push(`/(tabs)/workspace/pages/${localPage.id}` as any);
      } catch (error) {
        console.error("Failed to navigate to pinned page:", error);
        Alert.alert(
          "Navigation Error",
          "Something went wrong while opening this page. Please try again.",
          [{ text: "OK" }]
        );
      }
    },
    [onItemPress, router, isDragging]
  );

  const handleDragBegin = useCallback(() => {
    setIsDragging(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleDragEnd = useCallback(
    async ({ data }: { data: PinnedPage[] }) => {
      setIsDragging(false);

      // Check if order actually changed
      const orderChanged = data.some(
        (item, index) => item.id !== pinnedPages[index]?.id
      );

      if (!orderChanged) {
        return;
      }

      try {
        // Send reorder request to server
        const pageIds = data.map((item) => item.id);
        await reorderMutation.mutateAsync(pageIds);

        // Success haptic feedback
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      } catch (error) {
        console.error("Failed to reorder pinned pages:", error);

        // Error haptic feedback
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        Alert.alert(
          "Reorder Failed",
          "Failed to save the new order. Please try again.",
          [{ text: "OK" }]
        );
      }
    },
    [reorderMutation, pinnedPages]
  );

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<PinnedPage>) => {
      return (
        <DraggablePinnedItem
          item={item}
          onPress={handleItemPress}
          onLongPress={drag}
          isActive={isActive}
          isDragging={isDragging}
        />
      );
    },
    [handleItemPress, isDragging]
  );

  // Loading state
  if (isLoading) {
    return (
      <View className="py-4">
        <View className="px-6 py-2">
          <Text className="text-muted-foreground text-xs font-medium tracking-wider">
            Pinned
          </Text>
        </View>
        <View className="px-6 py-4 items-center">
          <ActivityIndicator size="small" color="#9ca3af" />
          <Text className="text-muted-foreground text-xs mt-2">
            Loading pinned pages...
          </Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View className="py-4">
        <View className="px-6 py-2">
          <Text className="text-muted-foreground text-xs font-medium tracking-wider">
            Pinned
          </Text>
        </View>
        <View className="px-6 py-4">
          <Text className="text-red-500 text-xs">
            Failed to load pinned pages
          </Text>
          <Text
            className="text-blue-500 text-xs mt-1 underline"
            onPress={() => refetch()}
          >
            Tap to retry
          </Text>
        </View>
      </View>
    );
  }

  // Empty state
  if (pinnedPages.length === 0) {
    return (
      <View className="py-4">
        <View className="px-6 py-2">
          <Text className="text-muted-foreground text-xs font-medium tracking-wider">
            Pinned
          </Text>
        </View>
        <View className="px-6 py-4">
          <Text className="text-muted-foreground text-xs">
            No pinned pages yet
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      className="py-2"
      style={{ maxHeight: 200 }} // Limit height
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled={true} // Explicitly enable for nested scrolling
      scrollEventThrottle={16}
    >
      {/* Pinned Section Header */}
      <View className="px-6 py-2">
        <Text className="text-muted-foreground text-xs font-medium tracking-wider">
          Pinned {isDragging && "(Reordering...)"}
        </Text>
      </View>

      {/* Draggable FlatList */}
      <DraggableFlatList
        data={pinnedPages}
        onDragBegin={handleDragBegin}
        onDragEnd={handleDragEnd}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        scrollEnabled={false} // Disable scrolling since it's inside another scrollable
        containerStyle={{
          flex: 0, // Don't take up all available space
        }}
        contentContainerStyle={{
          flexGrow: 0, // Don't expand to fill container
        }}
      />

      {/* Loading indicator during reorder */}
      {reorderMutation.isPending && (
        <View className="px-6 py-2 flex-row items-center">
          <ActivityIndicator size="small" color="#3b82f6" />
          <Text className="text-blue-500 text-xs ml-2">Saving order...</Text>
        </View>
      )}
    </ScrollView>
  );
}
