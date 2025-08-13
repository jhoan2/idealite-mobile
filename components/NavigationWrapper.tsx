// components/NavigationWrapper.tsx
import { useRouter } from "expo-router";
import {
  Bell,
  ChevronRight,
  Copy,
  FileText,
  Folder,
  Home,
  Inbox,
  Layers,
  Menu,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import ReanimatedAnimated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PinnedSection } from "./PinnedSection"; // Import the new component
import { ProfileHeader } from "./ProfileHeader"; // Import the existing component

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

  // Animation values for swipe gesture
  const translateX = useSharedValue(0);
  const backdropOpacity = useSharedValue(1);

  const openSidebar = () => {
    setSidebarVisible(true);
    translateX.value = 0;
    backdropOpacity.value = 1;
  };

  const closeSidebar = () => {
    setSidebarVisible(false);
    translateX.value = 0;
    backdropOpacity.value = 1;
  };

  // Enhanced close function for animations
  const animatedCloseSidebar = () => {
    translateX.value = withSpring(-SIDEBAR_WIDTH, {
      damping: 20,
      stiffness: 90,
    });
    backdropOpacity.value = withTiming(0, { duration: 200 });

    // Close modal after animation
    setTimeout(() => {
      runOnJS(closeSidebar)();
    }, 250);
  };

  // Handle settings press from ProfileHeader
  const handleSettingsPress = () => {
    closeSidebar();
    router.push("/(tabs)/settings" as any);
    // Or navigate to your settings screen
  };

  // Workspace sub-items
  const workspaceItems = [
    {
      id: "all-pages",
      title: "All Pages",
      icon: Layers,
      route: "/(tabs)/workspace/pages",
    },
    {
      id: "documents",
      title: "Documents",
      icon: FileText,
      route: "/(tabs)/workspace/documents",
    },
    {
      id: "templates",
      title: "Templates",
      icon: Copy,
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

    workspaceRotation.value = withTiming(newExpanded ? 90 : 0, {
      duration: 300,
    });
  };

  // Pan gesture for swipe to close
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Only allow swiping left (negative translation)
      const clampedTranslation = Math.min(0, event.translationX);
      translateX.value = clampedTranslation;

      // Update backdrop opacity based on swipe progress
      const progress = Math.abs(clampedTranslation) / SIDEBAR_WIDTH;
      backdropOpacity.value = Math.max(0.2, 1 - progress * 0.8);
    })
    .onEnd((event) => {
      const shouldClose =
        event.velocityX < -500 || // Fast swipe left
        Math.abs(event.translationX) > SIDEBAR_WIDTH * 0.3; // Swiped more than 30% of width

      if (shouldClose) {
        runOnJS(animatedCloseSidebar)();
      } else {
        // Snap back to original position
        translateX.value = withSpring(0, {
          damping: 20,
          stiffness: 90,
        });
        backdropOpacity.value = withTiming(1, { duration: 200 });
      }
    });

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

  const sidebarAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const backdropAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: backdropOpacity.value,
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
          <Menu size={24} color="#18181b" />
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
        {/* Animated Backdrop */}
        <ReanimatedAnimated.View
          style={[
            { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)" },
            backdropAnimatedStyle,
          ]}
        >
          <Pressable className="flex-1" onPress={closeSidebar}>
            {/* Gesture Detector wraps the sidebar */}
            <GestureDetector gesture={panGesture}>
              <ReanimatedAnimated.View
                className="absolute left-0 top-0 bottom-0 bg-white shadow-2xl"
                style={[
                  {
                    width: SIDEBAR_WIDTH,
                    paddingTop: insets.top,
                  },
                  sidebarAnimatedStyle,
                ]}
              >
                {/* Sidebar Header with ProfileHeader Component */}
                <View className="border-b border-border">
                  <ProfileHeader onSettingsPress={handleSettingsPress} />
                </View>

                {/* Navigation Items - Reordered */}
                <View className="flex-1 py-4">
                  {/* 1. Home */}
                  <TouchableOpacity
                    onPress={() => handleNavigate("/(tabs)/home")}
                    className="flex-row items-center px-6 py-4 active:bg-gray-100"
                    activeOpacity={0.7}
                  >
                    <Home size={24} color="#71717a" />
                    <Text className="text-foreground text-base font-medium ml-4">
                      Home
                    </Text>
                  </TouchableOpacity>

                  {/* 2. Collapsible Workspace Section */}
                  <View>
                    {/* Workspace Main Button */}
                    <TouchableOpacity
                      onPress={toggleWorkspace}
                      className="flex-row items-center justify-between px-6 py-4 active:bg-gray-100"
                      activeOpacity={0.7}
                    >
                      <View className="flex-row items-center">
                        <Folder size={24} color="#71717a" />
                        <Text className="text-foreground text-base font-medium ml-4">
                          Workspace
                        </Text>
                      </View>

                      <ReanimatedAnimated.View style={workspaceIconStyle}>
                        <ChevronRight size={20} color="#71717a" />
                      </ReanimatedAnimated.View>
                    </TouchableOpacity>

                    {/* Collapsible Sub-items */}
                    <ReanimatedAnimated.View
                      style={[workspaceAnimatedStyle, { overflow: "hidden" }]}
                    >
                      {workspaceItems.map((item) => {
                        const IconComponent = item.icon;
                        return (
                          <TouchableOpacity
                            key={item.id}
                            onPress={() => handleNavigate(item.route)}
                            className="flex-row items-center px-6 py-4 active:bg-gray-100"
                            activeOpacity={0.7}
                            style={{ paddingLeft: 48 }} // Extra indent for sub-items
                          >
                            <IconComponent size={20} color="#9ca3af" />
                            <Text className="text-muted-foreground text-sm font-medium ml-3">
                              {item.title}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ReanimatedAnimated.View>
                  </View>

                  {/* 3. Review */}
                  <TouchableOpacity
                    onPress={() => handleNavigate("/(tabs)/review")}
                    className="flex-row items-center px-6 py-4 active:bg-gray-100"
                    activeOpacity={0.7}
                  >
                    <Inbox size={24} color="#71717a" />
                    <Text className="text-foreground text-base font-medium ml-4">
                      Review
                    </Text>
                  </TouchableOpacity>

                  {/* 4. Notifications */}
                  <TouchableOpacity
                    onPress={() => handleNavigate("/(tabs)/notifications")}
                    className="flex-row items-center px-6 py-4 active:bg-gray-100"
                    activeOpacity={0.7}
                  >
                    <Bell size={24} color="#71717a" />
                    <Text className="text-foreground text-base font-medium ml-4">
                      Notifications
                    </Text>
                  </TouchableOpacity>

                  {/* 5. Pinned Section */}
                  <PinnedSection onItemPress={closeSidebar} />
                </View>
              </ReanimatedAnimated.View>
            </GestureDetector>
          </Pressable>
        </ReanimatedAnimated.View>
      </Modal>
    </View>
  );
}
