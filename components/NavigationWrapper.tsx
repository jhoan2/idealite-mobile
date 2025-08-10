// components/NavigationWrapper.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface NavigationWrapperProps {
  children: React.ReactNode;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.75; // 75% of screen width

export function NavigationWrapper({ children }: NavigationWrapperProps) {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const openSidebar = () => setSidebarVisible(true);
  const closeSidebar = () => setSidebarVisible(false);

  // Navigation items for the sidebar
  const navigationItems = [
    {
      id: "home",
      title: "Home",
      icon: "home-outline" as const,
      route: "/(tabs)/home",
    },
    {
      id: "workspace",
      title: "Workspace",
      icon: "folder-outline" as const,
      route: "/(tabs)/workspace",
    },
    {
      id: "review",
      title: "Review",
      icon: "library-outline" as const,
      route: "/(tabs)/review",
    },
    {
      id: "profile",
      title: "Profile",
      icon: "person-outline" as const,
      route: "/(tabs)/profile",
    },
    {
      id: "notifications",
      title: "Notifications",
      icon: "notifications-outline" as const,
      route: "/(tabs)/notifications",
    },
  ];

  const handleNavigate = (route: string) => {
    closeSidebar();
    router.push(route as any);
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header Bar */}
      <View
        className="bg-white border-b border-border flex-row items-center justify-between px-4"
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 12,
        }}
      >
        {/* Hamburger Menu Button */}
        <TouchableOpacity
          onPress={openSidebar}
          className="p-2 -ml-2"
          activeOpacity={0.7}
        >
          <Ionicons name="menu-outline" size={24} color="#18181b" />
        </TouchableOpacity>

        {/* App Title/Logo Area */}
        <Text className="text-foreground text-lg font-semibold">Idealite</Text>

        {/* Right side placeholder for future actions */}
        <View className="w-10" />
      </View>

      {/* Main Content Area */}
      <View className="flex-1">{children}</View>

      {/* Right Sidebar Modal */}
      <Modal
        visible={sidebarVisible}
        transparent
        animationType="fade"
        onRequestClose={closeSidebar}
      >
        {/* Backdrop */}
        <Pressable className="flex-1 bg-black/50" onPress={closeSidebar}>
          {/* Sidebar Container */}
          <Animated.View
            className="absolute left-0 top-0 bottom-0 bg-white shadow-2xl"
            style={{
              width: SIDEBAR_WIDTH,
              paddingTop: insets.top,
            }}
          >
            {/* Sidebar Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-border">
              <Text className="text-foreground text-lg font-semibold">
                Navigation
              </Text>
              <TouchableOpacity
                onPress={closeSidebar}
                className="p-2 -mr-2"
                activeOpacity={0.7}
              >
                <Ionicons name="close-outline" size={24} color="#18181b" />
              </TouchableOpacity>
            </View>

            {/* Navigation Items */}
            <View className="flex-1 py-4">
              {navigationItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleNavigate(item.route)}
                  className="flex-row items-center px-6 py-4 active:bg-gray-100"
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={item.icon}
                    size={24}
                    color="#71717a"
                    className="mr-4"
                  />
                  <Text className="text-foreground text-base font-medium ml-4">
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Divider */}
              <View className="h-px bg-border mx-6 my-4" />

              {/* Additional Actions */}
              <TouchableOpacity
                onPress={() => {
                  closeSidebar();
                  // Add settings navigation here
                  console.log("Navigate to settings");
                }}
                className="flex-row items-center px-6 py-4 active:bg-gray-100"
                activeOpacity={0.7}
              >
                <Ionicons
                  name="settings-outline"
                  size={24}
                  color="#71717a"
                  className="mr-4"
                />
                <Text className="text-foreground text-base font-medium ml-4">
                  Settings
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  closeSidebar();
                  // Add help navigation here
                  console.log("Navigate to help");
                }}
                className="flex-row items-center px-6 py-4 active:bg-gray-100"
                activeOpacity={0.7}
              >
                <Ionicons
                  name="help-circle-outline"
                  size={24}
                  color="#71717a"
                  className="mr-4"
                />
                <Text className="text-foreground text-base font-medium ml-4">
                  Help & Support
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sidebar Footer */}
            <View className="border-t border-border p-4">
              <Text className="text-muted-foreground text-sm text-center">
                Idealite Mobile v1.0.0
              </Text>
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}
