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
import ReanimatedAnimated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface NavigationWrapperProps {
  children: React.ReactNode;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.75; // 75% of screen width

export function NavigationWrapper({ children }: NavigationWrapperProps) {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [workspaceExpanded, setWorkspaceExpanded] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Animation values for workspace collapsible
  const workspaceHeight = useSharedValue(0);
  const workspaceRotation = useSharedValue(0);

  const openSidebar = () => setSidebarVisible(true);
  const closeSidebar = () => setSidebarVisible(false);

  // Regular navigation items
  const navigationItems = [
    {
      id: "home",
      title: "Home",
      icon: "home-outline" as const,
      route: "/(tabs)/home",
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

  // Workspace sub-items
  const workspaceItems = [
    {
      id: "projects",
      title: "Projects",
      icon: "folder-outline" as const,
      route: "/(tabs)/workspace/projects",
    },
    {
      id: "documents",
      title: "Documents",
      icon: "document-outline" as const,
      route: "/(tabs)/workspace/documents",
    },
    {
      id: "templates",
      title: "Templates",
      icon: "copy-outline" as const,
      route: "/(tabs)/workspace/templates",
    },
  ];

  const handleNavigate = (route: string) => {
    closeSidebar();
    router.push(route as any);
  };

  const toggleWorkspace = () => {
    const newExpanded = !workspaceExpanded;
    setWorkspaceExpanded(newExpanded);

    // Calculate height for 3 items (each ~56px tall)
    const targetHeight = newExpanded ? 168 : 0;

    workspaceHeight.value = withTiming(targetHeight, {
      duration: 300,
    });

    workspaceRotation.value = withTiming(newExpanded ? 180 : 0, {
      duration: 300,
    });
  };

  const workspaceAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: workspaceHeight.value,
      opacity: interpolate(
        workspaceHeight.value,
        [0, 84, 168],
        [0, 0.5, 1],
        Extrapolation.CLAMP
      ),
    };
  });

  const workspaceIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${workspaceRotation.value}deg` }],
    };
  });

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

      {/* Left Sidebar Modal */}
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
              {/* Regular navigation items */}
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

              {/* Collapsible Workspace Section */}
              <View>
                {/* Workspace Main Button */}
                <TouchableOpacity
                  onPress={toggleWorkspace}
                  className="flex-row items-center justify-between px-6 py-4 active:bg-gray-100"
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center">
                    <Ionicons
                      name="folder-outline"
                      size={24}
                      color="#71717a"
                      className="mr-4"
                    />
                    <Text className="text-foreground text-base font-medium ml-4">
                      Workspace
                    </Text>
                  </View>

                  <ReanimatedAnimated.View style={workspaceIconStyle}>
                    <Ionicons
                      name="chevron-down-outline"
                      size={20}
                      color="#71717a"
                    />
                  </ReanimatedAnimated.View>
                </TouchableOpacity>

                {/* Collapsible Sub-items */}
                <ReanimatedAnimated.View
                  style={[workspaceAnimatedStyle, { overflow: "hidden" }]}
                >
                  {workspaceItems.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => handleNavigate(item.route)}
                      className="flex-row items-center px-6 py-4 active:bg-gray-100"
                      activeOpacity={0.7}
                      style={{ paddingLeft: 48 }} // Extra indent for sub-items
                    >
                      <Ionicons
                        name={item.icon}
                        size={20}
                        color="#9ca3af"
                        className="mr-3"
                      />
                      <Text className="text-muted-foreground text-sm font-medium ml-3">
                        {item.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ReanimatedAnimated.View>
              </View>

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
