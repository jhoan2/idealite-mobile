// components/notifications/NotificationsEmptyState.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

export function NotificationsEmptyState() {
  return (
    <View className="flex-1 justify-center items-center px-6">
      <View className="items-center">
        <View className="w-16 h-16 bg-muted rounded-full items-center justify-center mb-4">
          <Ionicons name="notifications-outline" size={32} color="#71717a" />
        </View>

        <Text className="text-lg font-semibold text-foreground mb-2 text-center">
          No notifications yet
        </Text>

        <Text className="text-sm text-muted-foreground text-center max-w-sm">
          You'll see notifications here when there are updates to your pages,
          cards, or system messages.
        </Text>
      </View>
    </View>
  );
}
