// app/(tabs)/profile/index.tsx
import { useAuth } from "@clerk/clerk-expo";
import React from "react";
import { SafeAreaView, Text, View } from "react-native";

export default function ProfileScreen() {
  const { signOut } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-foreground text-2xl font-bold">
          This is the profile page
        </Text>
      </View>
    </SafeAreaView>
  );
}
