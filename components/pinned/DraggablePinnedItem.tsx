// components/pinned/DraggablePinnedItem.tsx - Simplified with react-native-draggable-flatlist
import { FileText } from "lucide-react-native";
import React, { useCallback } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { PinnedPage } from "../../hooks/pinned/usePinnedPages";

interface DraggablePinnedItemProps {
  item: PinnedPage;
  onPress: (pageId: string) => void;
  onLongPress: () => void; // This comes from the DraggableFlatList
  isActive: boolean; // This indicates if the item is currently being dragged
  isDragging: boolean; // This indicates if any item in the list is being dragged
}

export function DraggablePinnedItem({
  item,
  onPress,
  onLongPress,
  isActive,
  isDragging,
}: DraggablePinnedItemProps) {
  const handlePress = useCallback(() => {
    if (!isDragging && !isActive) {
      onPress(item.id);
    }
  }, [isDragging, isActive, onPress, item.id]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={onLongPress}
      className={`flex-row items-center px-6 py-3 active:bg-gray-100 ${
        isActive ? "bg-gray-50" : ""
      }`}
      activeOpacity={0.7}
      disabled={isDragging && !isActive}
      style={{
        opacity: isActive ? 0.9 : 1,
        transform: [{ scale: isActive ? 1.02 : 1 }],
      }}
    >
      <View className="flex-row items-center flex-1">
        <FileText size={16} color="#9ca3af" />
        <Text
          className="text-sm font-medium ml-3 flex-1"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.title}
        </Text>
      </View>

      {/* Enhanced drag handle */}
      <View className={`ml-2 p-2 ${isActive ? "opacity-80" : "opacity-50"}`}>
        <View className="flex-row">
          <View className="mr-1">
            <View className="w-1 h-1 bg-gray-400 rounded-full mb-1" />
            <View className="w-1 h-1 bg-gray-400 rounded-full mb-1" />
            <View className="w-1 h-1 bg-gray-400 rounded-full" />
          </View>
          <View>
            <View className="w-1 h-1 bg-gray-400 rounded-full mb-1" />
            <View className="w-1 h-1 bg-gray-400 rounded-full mb-1" />
            <View className="w-1 h-1 bg-gray-400 rounded-full" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
