// components/TagTreeModalHeader.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface TagTreeModalHeaderProps {
  onClose: () => void;
}

export function TagTreeModalHeader({ onClose }: TagTreeModalHeaderProps) {
  return (
    <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-4">
      <View className="flex-row items-center">
        <Text className="text-lg font-semibold text-gray-900">Tags</Text>
      </View>

      <View className="flex-row items-center space-x-3">
        {/* Close Button */}
        <TouchableOpacity onPress={onClose} className="p-2" activeOpacity={0.7}>
          <Ionicons name="close" size={24} color="#111827" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
