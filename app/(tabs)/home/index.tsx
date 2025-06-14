// app/(tabs)/home/index.tsx - Simple home screen
import { useAuth } from "@clerk/clerk-expo";
import React from "react";
import { SafeAreaView, Text, View } from "react-native";

export default function HomeScreen() {
  const { signOut } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-foreground text-2xl font-bold">
          This is the home page
        </Text>
      </View>
    </SafeAreaView>
  );
}
