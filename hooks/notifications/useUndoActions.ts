// hooks/notifications/useUndoActions.ts
import { useAuth } from "@clerk/clerk-expo";
import * as Sentry from "@sentry/react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";

async function undoPageArchive(
  token: string,
  notificationId: string
): Promise<any> {
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_URL}/api/v1/notifications/undo/page-archive`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        notificationId,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Undo failed: ${response.status}`);
  }

  return response.json();
}

export function useUndoAction() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      notificationId,
      eventType,
    }: {
      notificationId: string;
      eventType: string;
    }) => {
      const token = await getToken();
      if (!token) {
        throw new Error("No authentication token available");
      }

      switch (eventType) {
        case "auto_archive":
          return await undoPageArchive(token, notificationId);

        case "creation":
          // Placeholder for future implementation
          throw new Error("Undo for creation actions not yet implemented");

        case "deletion":
          // Placeholder for future implementation
          throw new Error("Undo for deletion actions not yet implemented");

        case "update":
          // Placeholder for future implementation
          throw new Error("Undo for update actions not yet implemented");

        default:
          throw new Error(`Undo action for ${eventType} is not supported`);
      }
    },
    onSuccess: (data, variables) => {
      // Show success message
      Alert.alert(
        "Success",
        variables.eventType === "auto_archive"
          ? "Page archive action has been undone"
          : "Action has been undone"
      );

      // Refresh notification-related queries
      queryClient.invalidateQueries({ queryKey: ["notifications-infinite"] });
      queryClient.invalidateQueries({ queryKey: ["notification-counts"] });
    },
    onError: (error, variables) => {
      // Log error to Sentry
      Sentry.captureException(error, {
        tags: {
          action: "undo_notification",
          event_type: variables.eventType,
          notification_id: variables.notificationId,
        },
        contexts: {
          notification: {
            id: variables.notificationId,
            event_type: variables.eventType,
          },
        },
      });

      // Show error message to user
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to undo action. Please try again.";

      Alert.alert("Error", errorMessage);
    },
  });
}

// Helper function to determine if notification can be undone
export function canUndoNotification(notification: {
  notification_type: string;
  event_type: string;
  status: string;
}): boolean {
  // Don't show undo for already reversed notifications
  if (notification.status === "reversed") {
    return false;
  }

  // Check if notification type supports undo
  const undoableTypes = ["creation", "deletion", "update"];
  const isUndoableType = undoableTypes.includes(notification.notification_type);
  const isAutoArchive = notification.event_type === "auto_archive";

  return isUndoableType || isAutoArchive;
}
