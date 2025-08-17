// components/page/PageItem.tsx - Updated to use separate ImagePreviews component
import { Clock } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { ImagePreviews } from "./ImagePreviews";

function getRelativeTime(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays}d`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}M`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears}y`;
}

// Updated Page interface with new fields
export interface Page {
  id: number;
  server_id?: string | null;
  title: string;
  content: string | null;
  description: string | null; // NEW
  image_previews: string | null; // NEW - JSON string
  created_at: string;
  updated_at: string;
  last_synced_at?: string | null;
  is_dirty: boolean;
}

export interface PageItemProps {
  item: Page;
  onPress: (page: Page) => void;
}

export function PageItem({ item, onPress }: PageItemProps) {
  // Parse image previews from JSON string
  const imagePreviews = item.image_previews
    ? JSON.parse(item.image_previews)
    : [];

  return (
    <TouchableOpacity
      onPress={() => onPress(item)}
      className="bg-white mx-4 mb-3 p-4 rounded-lg border border-gray-200 active:bg-gray-50"
      activeOpacity={0.7}
    >
      {/* Header with title */}
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-3">
          <Text
            className="text-gray-900 text-lg font-semibold"
            numberOfLines={1}
          >
            {item.title || "Untitled Page"}
          </Text>

          {/* Description text */}
          {item.description && (
            <Text className="text-gray-600 text-sm mt-1" numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
      </View>

      {/* Image previews - now using separate component */}
      <ImagePreviews imagePreviews={imagePreviews} maxPreviews={3} />

      {/* Footer with timestamps */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Clock size={14} color="#9ca3af" />
          <Text className="text-gray-500 text-xs ml-1">
            {getRelativeTime(item.updated_at)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
