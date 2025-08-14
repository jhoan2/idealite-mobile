// components/PageList.tsx
import { usePages } from "@/hooks/page/usePages";
import { Edit3 } from "lucide-react-native";
import React from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

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

export function PageList() {
  const { pages, isLoading, createPage } = usePages();

  const handleCreatePage = async () => {
    try {
      await createPage("New Page");
    } catch (error) {
      console.error("Failed to create page:", error);
    }
  };

  if (isLoading) {
    return <Text>Loading pages...</Text>;
  }

  return (
    <View className="flex-1">
      <FlatList
        data={pages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View className="p-4 border-b border-gray-200">
            <Text className="font-medium">{item.title}</Text>
            <Text className="text-xs text-gray-500 mt-1 pt-2">
              {getRelativeTime(item.updated_at)}
            </Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 80 }} // Add padding to prevent overlap with FAB
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={handleCreatePage}
        className="absolute bottom-10 right-6 w-14 h-14 bg-blue-500 rounded-full items-center justify-center shadow-lg"
        style={{
          elevation: 8, // Android shadow
          shadowColor: "#000", // iOS shadow
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
        }}
      >
        <Edit3 size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}
