// lib/notifications/notificationUtils.ts
import { Ionicons } from "@expo/vector-icons";

// Get notification icon based on type
export function getNotificationIcon(
  type: string
): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case "creation":
      return "add-circle-outline";
    case "deletion":
      return "remove-circle-outline";
    case "info":
      return "information-circle-outline";
    case "update":
      return "create-outline";
    case "suggestion":
      return "bulb-outline";
    default:
      return "information-circle-outline";
  }
}

// Format relative time (similar to web app)
export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return "now";
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  if (diffInHours < 24) return `${diffInHours}h`;
  if (diffInDays < 7) return `${diffInDays}d`;

  // For older notifications, show the actual date
  return date.toLocaleDateString();
}
