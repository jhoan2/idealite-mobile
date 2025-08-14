// components/PageList.tsx
import { usePages } from "@/hooks/page/usePages";
import { Edit3 } from "lucide-react-native";
import React from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

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
            <Text className="text-xs text-gray-500 mt-1">
              {item.is_dirty ? "Needs sync" : "Synced"} • Updated:{" "}
              {new Date(item.updated_at).toLocaleDateString()}
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
