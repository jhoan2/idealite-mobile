import React from "react";
import { SafeAreaView, Text, View } from "react-native";

export default function GlobalTagsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 p-4">
        <Text className="text-2xl font-bold text-foreground mb-4">
          Global Tags
        </Text>
        <Text className="text-muted-foreground">
          Manage your global tags here
        </Text>
        {/* Add your global tags component/logic here */}
      </View>
    </SafeAreaView>
  );
}
