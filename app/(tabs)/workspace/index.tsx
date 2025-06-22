// app/(tabs)/workspace/index.tsx - Main workspace screen
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { SafeAreaView, Text, TouchableOpacity, View } from "react-native";

export default function WorkspaceScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center items-center px-6">
        {/* Main Content Container */}
        <View className="items-center space-y-6">
          {/* Icon Container */}
          <TouchableOpacity
            className="w-24 h-24 bg-primary/10 rounded-full justify-center items-center mb-4"
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="description"
              size={48}
              className="text-primary"
              color="#F2A71B" // You can adjust this color to match your theme
            />
          </TouchableOpacity>

          {/* Title */}
          <Text className="text-2xl font-semibold text-foreground text-center">
            No file is open.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
