// app/(tabs)/review/index.tsx
import React from "react";
import { SafeAreaView, Text, View } from "react-native";

export default function ReviewScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-foreground text-2xl font-bold">
          This is the review page
        </Text>
      </View>
    </SafeAreaView>
  );
}
