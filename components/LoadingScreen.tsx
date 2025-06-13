// components/LoadingScreen.tsx
import React from "react";
import { ActivityIndicator, SafeAreaView, Text, View } from "react-native";

export function LoadingScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#18181b" />
        <Text className="text-muted-foreground mt-4">Loading...</Text>
      </View>
    </SafeAreaView>
  );
}
