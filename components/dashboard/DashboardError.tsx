// components/dashboard/DashboardError.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface DashboardErrorProps {
  error: string;
  onRetry: () => void;
}

export function DashboardError({ error, onRetry }: DashboardErrorProps) {
  return (
    <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <View className="items-center">
        <View className="bg-red-50 rounded-full p-3 mb-4">
          <Ionicons name="alert-circle-outline" size={24} color="#ef4444" />
        </View>

        <Text className="text-lg font-semibold text-gray-900 mb-2 text-center">
          Failed to load dashboard
        </Text>

        <Text className="text-sm text-gray-600 mb-4 text-center">{error}</Text>

        <TouchableOpacity
          onPress={onRetry}
          className="bg-primary px-6 py-2 rounded-lg"
          activeOpacity={0.8}
        >
          <Text className="text-primary-foreground font-medium">Try Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
