import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfilePlaceholder() {
  const handleSignIn = () => {
    // Trigger sign-in modal or navigation
    // You can customize this based on your auth flow
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerClassName="p-6">
        <View className="mb-6">
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Account Settings
          </Text>
          <Text className="text-base text-gray-500">
            Manage your account settings and preferences
          </Text>
        </View>

        <View className="h-px bg-gray-200 mb-6" />

        <View className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <View className="p-6 pb-0">
            <Text className="text-xl font-semibold text-gray-900">
              My Profile
            </Text>
          </View>

          <View className="p-6">
            <View className="flex-row items-center">
              <View className="w-16 h-16 rounded-full bg-gray-100 justify-center items-center mr-4">
                <Ionicons name="person" size={32} color="#9ca3af" />
              </View>

              <View className="flex-1">
                <Text className="text-sm text-gray-500 mb-3">
                  Sign in to view your profile
                </Text>

                <TouchableOpacity
                  className="flex-row items-center bg-blue-500 px-4 py-2.5 rounded-md self-start"
                  onPress={handleSignIn}
                >
                  <Ionicons
                    name="log-in-outline"
                    size={20}
                    color="#ffffff"
                    className="mr-2"
                  />
                  <Text className="text-white text-sm font-medium">
                    Sign In
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
