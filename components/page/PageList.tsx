// components/PageList.tsx
import { usePages } from "@/hooks/page/usePages";
import React from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { SyncStatus } from "./SyncStatus";

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
      <SyncStatus />

      <FlatList
        data={pages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View className="p-4 border-b border-gray-200">
            <Text className="font-medium">{item.title}</Text>
            <Text className="text-xs text-gray-500 mt-1">
              {item.is_dirty ? "Needs sync" : "Synced"} • Updated:{" "}
              {new Date(item.updated_at).toLocaleDateString()}
            </Text>
          </View>
        )}
        ListFooterComponent={
          <TouchableOpacity
            onPress={handleCreatePage}
            className="p-4 bg-blue-500 rounded-lg m-4"
          >
            <Text className="text-white text-center font-medium">
              Create New Page
            </Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
}
