// app/(tabs)/workspace/graph.tsx
import React from "react";
import { SafeAreaView, Text, TouchableOpacity, View } from "react-native";

export default function GraphScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center items-center px-6">
        {/* Main Content Container */}
        <View className="items-center space-y-6">
          {/* Icon Container */}
          <TouchableOpacity
            className="w-24 h-24 bg-primary/10 rounded-full justify-center items-center mb-4"
            activeOpacity={0.7}
          ></TouchableOpacity>

          {/* Title */}
          <Text className="text-2xl font-semibold text-foreground text-center">
            Knowledge Graph
          </Text>

          {/* Description */}
          <Text className="text-muted-foreground text-center max-w-sm">
            Visualize the connections between your notes and ideas. This
            interactive graph view is coming soon!
          </Text>

          {/* Status Badge */}
          <View className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <Text className="text-blue-700 text-sm font-medium">
              🚧 Coming Soon
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
