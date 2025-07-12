// components/TagTreeModalHeader.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface TagTreeModalHeaderProps {
  onClose: () => void;
}

export function TagTreeModalHeader({ onClose }: TagTreeModalHeaderProps) {
  const router = useRouter();

  const handleGlobalTagsPress = () => {
    router.navigate("/workspace/global-tags");
    onClose(); // Close the modal when navigating
  };

  const handleArchivePress = () => {
    // TODO: Navigate to archive page or show archived items
    console.log("Archive button pressed");
    // onClose();
  };

  return (
    <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-4">
      <View className="flex-row items-center">
        <Text className="text-lg font-semibold text-gray-900">Workspace</Text>
      </View>

      <View className="flex-row items-center space-x-3">
        {/* Archive Button */}
        <TouchableOpacity
          onPress={handleArchivePress}
          className="p-2"
          activeOpacity={0.7}
        >
          <Ionicons name="archive-outline" size={20} color="#111827" />
        </TouchableOpacity>

        {/* Global Tags Button */}
        <TouchableOpacity
          onPress={handleGlobalTagsPress}
          className="p-2"
          activeOpacity={0.7}
        >
          <Ionicons name="globe-outline" size={20} color="#111827" />
        </TouchableOpacity>

        {/* Close Button */}
        <TouchableOpacity onPress={onClose} className="p-2" activeOpacity={0.7}>
          <Ionicons name="close" size={24} color="#111827" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
