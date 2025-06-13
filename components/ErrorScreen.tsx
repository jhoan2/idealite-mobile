// components/ErrorScreen.tsx
import React from "react";
import { SafeAreaView, Text, TouchableOpacity, View } from "react-native";

interface ErrorScreenProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorScreen({
  message = "Something went wrong",
  onRetry,
}: ErrorScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center items-center px-6">
        <Text className="text-2xl font-bold text-foreground mb-4">Oops!</Text>
        <Text className="text-muted-foreground text-center mb-8">
          {message}
        </Text>

        {onRetry && (
          <TouchableOpacity
            onPress={onRetry}
            className="bg-primary rounded-xl py-3 px-6"
            activeOpacity={0.8}
          >
            <Text className="text-primary-foreground font-medium">
              Try Again
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
