// components/notifications/NotificationItem.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import type { Notification } from "../../hooks/notifications/useNotifications";
import {
  canUndoNotification,
  useUndoAction,
} from "../../hooks/notifications/useUndoActions";
import {
  getNotificationIcon,
  getRelativeTime,
} from "../../lib/notifications/notificationUtils";

interface NotificationItemProps {
  notification: Notification;
  onPress: (notification: Notification) => void;
  undoMutation: ReturnType<typeof useUndoAction>;
}

export function NotificationItem({
  notification,
  onPress,
  undoMutation,
}: NotificationItemProps) {
  const IconComponent = getNotificationIcon(notification.notification_type);
  const isUnread = notification.status === "unread";
  const canUndo = canUndoNotification(notification);
  const isUndoing =
    undoMutation.isPending &&
    undoMutation.variables?.notificationId === notification.id;

  const handleUndo = useCallback(() => {
    undoMutation.mutate({
      notificationId: notification.id,
      eventType: notification.event_type,
    });
  }, [undoMutation, notification.id, notification.event_type]);

  return (
    <TouchableOpacity
      onPress={() => onPress(notification)}
      className={`flex-row items-start p-4 border-b border-border ${
        isUnread ? "bg-muted/30" : "bg-background"
      }`}
      activeOpacity={0.7}
    >
      {/* Icon */}
      <View
        className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
          isUnread ? "bg-primary/10" : "bg-muted"
        }`}
      >
        <Ionicons
          name={IconComponent}
          size={18}
          color={isUnread ? "#18181b" : "#71717a"}
        />
      </View>

      {/* Content */}
      <View className="flex-1 min-w-0">
        <View className="flex-row items-center justify-between mb-1">
          <Text
            className={`flex-1 text-sm font-medium ${
              isUnread ? "text-foreground" : "text-muted-foreground"
            }`}
            numberOfLines={1}
          >
            {notification.title}
          </Text>

          <View className="flex-row items-center ml-2">
            <Text className="text-xs text-muted-foreground">
              {getRelativeTime(notification.created_at)}
            </Text>

            {/* Undo button */}
            {canUndo && (
              <TouchableOpacity
                onPress={handleUndo}
                disabled={isUndoing}
                className={`ml-2 w-6 h-6 items-center justify-center rounded ${
                  isUndoing ? "opacity-50" : ""
                }`}
                activeOpacity={0.7}
              >
                {isUndoing ? (
                  <ActivityIndicator size="small" color="#71717a" />
                ) : (
                  <Ionicons
                    name="arrow-undo-outline"
                    size={14}
                    color="#71717a"
                  />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
        <Text className="text-sm text-muted-foreground" numberOfLines={2}>
          {notification.message}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
