// components/notifications/NotificationBadge.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import { useNotificationCounts } from "../../hooks/notifications/useNotificationCounts";

interface NotificationBadgeProps {
  color: string;
  focused: boolean;
  size?: number;
}

export function NotificationBadge({
  color,
  focused,
  size = 22,
}: NotificationBadgeProps) {
  const { data: counts, isLoading, error } = useNotificationCounts();

  // Don't show badge if loading or error - just show the icon
  const unreadCount = !isLoading && !error ? counts?.unread || 0 : 0;

  return (
    <View className="relative">
      <Ionicons
        name={focused ? "notifications" : "notifications-outline"}
        size={size}
        color={color}
      />
      {unreadCount > 0 && (
        <View className="absolute -right-2 -top-2 min-w-[20px] h-5 bg-red-500 rounded-full items-center justify-center px-1">
          <Text className="text-white text-xs font-bold text-center">
            {unreadCount > 99 ? "99+" : unreadCount.toString()}
          </Text>
        </View>
      )}
    </View>
  );
}
