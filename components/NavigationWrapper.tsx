// components/NavigationWrapper.tsx - Updated with Tag Tree Button
import { usePathname, useRouter } from "expo-router";
import {
  Bell,
  ChevronRight,
  Folder,
  Home,
  Inbox,
  Layers,
  LibraryBig,
  Map,
  Menu,
  Search,
  StickyNote,
  Tag,
  X,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { pageRepository } from "../db/pageRepository";
import { getSearchConfig, isSearchableRoute } from "../lib/searchRoutes";
import { useSearchStore } from "../store/searchStore";
import { PinnedSection } from "./pinned/PinnedSection";
import { ProfileHeader } from "./ProfileHeader";
import { TagTreeModal } from "./TagTreeModal";

interface NavigationWrapperProps {
  children: React.ReactNode;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.75; // 75% of screen width

export function NavigationWrapper({ children }: NavigationWrapperProps) {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [workspaceExpanded, setWorkspaceExpanded] = useState(false);
  const [loadingStates, setLoadingStates] = useState<{
    [key: string]: boolean;
  }>({});

  // Add TagTreeModal state
  const [showTagTreeModal, setShowTagTreeModal] = useState(false);

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();

  // Search functionality
  const {
    query,
    isSearching,
    setQuery,
    clearSearch,
    setSearchContext,
    shouldShowSearch,
    searchUIVisible,
    setSearchUIVisible,
  } = useSearchStore();

  // Animation values for workspace collapsible
  const workspaceHeight = useSharedValue(0);
  const workspaceRotation = useSharedValue(0);

  // Animation values for swipe gesture
  const translateX = useSharedValue(0);
  const backdropOpacity = useSharedValue(1);

  // Update search context when route changes
  useEffect(() => {
    const searchConfig = getSearchConfig(pathname);
    setSearchContext(searchConfig?.context || null);
  }, [pathname, setSearchContext]);

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
  };

  // Create new page/canvas function
  const handleCreateAction = async (type: "page" | "canvas") => {
    const loadingKey = `create-${type}`;

    try {
      setLoadingStates((prev) => ({ ...prev, [loadingKey]: true }));

      const contentType = type === "page" ? "page" : "canvas";
      const defaultTitle =
        type === "page" ? "Untitled Page" : "Untitled Memory Map";
      const defaultContent = type === "page" ? "<p>Start writing...</p>" : "";

      const newPage = await pageRepository.createPageWithUniqueTitle(
        defaultTitle,
        {
          content: defaultContent,
          content_type: contentType,
          description: null,
          image_previews: null,
          canvas_image_cid: null,
          deleted: false,
        }
      );

      // Close sidebar first
      closeSidebar();

      // Navigate to appropriate editor
      if (type === "canvas") {
        router.push({
          pathname: "/(tabs)/workspace/canvas/[id]",
          params: { id: newPage.id.toString() },
        });
      } else {
        router.push({
          pathname: "/(tabs)/workspace/pages/[id]",
          params: { id: newPage.id.toString() },
        });
      }
    } catch (error) {
      console.error(`Error creating ${type}:`, error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Check if we're on the global-tags route
  const isGlobalTagsRoute = pathname === "/workspace/global-tags";

  // Workspace items including create buttons
  const workspaceItems = [
    {
      id: "create-page",
      title: "Create Page",
      icon: StickyNote,
      isCreateButton: true,
      createType: "page" as const,
    },
    {
      id: "create-canvas",
      title: "Create Memory Map",
      icon: Map,
      isCreateButton: true,
      createType: "canvas" as const,
    },
    {
      id: "all-pages",
      title: "All Pages",
      icon: Layers,
      route: "/(tabs)/workspace/pages",
      isCreateButton: false,
    },
    {
      id: "tags",
      title: "Tags",
      icon: Tag,
      route: "/(tabs)/workspace/global-tags",
      isCreateButton: false,
    },
    {
      id: "resources",
      title: "Resources",
      icon: LibraryBig,
      route: "/(tabs)/workspace/resources",
      isCreateButton: false,
    },
    // {
    //   id: "graph",
    //   title: "Graph",
    //   icon: ChartNetwork,
    //   route: "/(tabs)/workspace/graph",
    //   isCreateButton: false,
    // },
  ];

  const handleNavigate = (route: string) => {
    closeSidebar();
    router.push(route as any);
  };

  const toggleWorkspace = () => {
    const newExpanded = !workspaceExpanded;
    setWorkspaceExpanded(newExpanded);

    // Calculate height for 5 items (each ~56px tall)
    const targetHeight = newExpanded ? 290 : 0;

    workspaceHeight.value = withTiming(targetHeight, {
      duration: 300,
    });

    workspaceRotation.value = withTiming(newExpanded ? 90 : 0, {
      duration: 300,
    });
  };

  // Modern Pan gesture for swipe to close
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
        [0, 140, 280],
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

  // Handle entering search mode
  const enterSearchMode = () => {
    setSearchUIVisible(true);
  };

  // Handle exiting search mode
  const exitSearchMode = () => {
    setSearchUIVisible(false); // This will also clear the search
  };

  // Get search configuration for current route
  const searchConfig = getSearchConfig(pathname);
  const showSearchButton = shouldShowSearch() && isSearchableRoute(pathname);

  // Get page title for header
  const getPageTitle = () => {
    switch (pathname) {
      case "/workspace/pages":
        return "All Pages";
      case "/workspace/global-tags":
        return "Global Tags";
      case "/home":
        return "Home";
      case "/review":
        return "Review";
      case "/notifications":
        return "Notifications";
      case "/profile":
        return "Profile";
      case "/workspace/resources":
        return "Resources";
      case "/workspace/graph":
        return "Graph";
      default:
        return pathname.replace("/", "").replace(/-/g, " ");
    }
  };

  // Determine what to show on the right side of header
  const getRightHeaderContent = () => {
    if (isGlobalTagsRoute) {
      // Show tag tree button on global-tags route
      return (
        <TouchableOpacity
          onPress={() => setShowTagTreeModal(true)}
          className="p-2 -mr-2"
          activeOpacity={0.7}
        >
          <Tag size={24} color="#18181b" />
        </TouchableOpacity>
      );
    } else if (showSearchButton) {
      // Show search button on searchable routes
      return (
        <TouchableOpacity
          onPress={enterSearchMode}
          className="p-2 -mr-2"
          activeOpacity={0.7}
        >
          <Search size={24} color="#18181b" />
        </TouchableOpacity>
      );
    } else {
      // Show placeholder spacer
      return <View className="w-10" />;
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header Bar */}
      <View
        className="bg-white border-b border-border"
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 12,
        }}
      >
        {searchUIVisible && searchConfig ? (
          /* Search Mode Header */
          <View className="flex-row items-center px-4">
            {/* Close Search Button */}
            <TouchableOpacity
              onPress={exitSearchMode}
              className="p-2 -ml-2"
              activeOpacity={0.7}
            >
              <X size={24} color="#18181b" />
            </TouchableOpacity>

            {/* Search Input */}
            <View className="flex-1 flex-row items-center bg-gray-100 rounded-lg px-3 py-2 mx-3">
              <Search size={20} color="#9ca3af" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={searchConfig.placeholder}
                placeholderTextColor="#9ca3af"
                className="flex-1 ml-2 text-gray-900 text-base"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                maxLength={100}
                autoFocus={true} // Auto focus when entering search mode
              />
              {query.length > 0 && (
                <TouchableOpacity
                  onPress={() => setQuery("")}
                  className="ml-2 p-1"
                  activeOpacity={0.7}
                >
                  <X size={18} color="#9ca3af" />
                </TouchableOpacity>
              )}
              {isSearching && (
                <ActivityIndicator
                  size="small"
                  color="#3b82f6"
                  style={{ marginLeft: 8 }}
                />
              )}
            </View>
          </View>
        ) : (
          /* Normal Header */
          <View className="flex-row items-center justify-between px-4">
            {/* Hamburger Menu Button */}
            <TouchableOpacity
              onPress={openSidebar}
              className="p-2 -ml-2"
              activeOpacity={0.7}
            >
              <Menu size={24} color="#18181b" />
            </TouchableOpacity>

            {/* App Title */}
            <Text className="text-foreground text-lg font-semibold">
              {getPageTitle()}
            </Text>

            {/* Right Side - Context-specific button */}
            {getRightHeaderContent()}
          </View>
        )}
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
        <GestureHandlerRootView style={{ flex: 1 }}>
          {/* Animated Backdrop */}
          <Animated.View
            style={[
              { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)" },
              backdropAnimatedStyle,
            ]}
          >
            <Pressable className="flex-1" onPress={closeSidebar}>
              {/* Gesture Detector wraps the sidebar */}
              <GestureDetector gesture={panGesture}>
                <Animated.View
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

                  {/* Navigation Items */}
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

                        <Animated.View style={workspaceIconStyle}>
                          <ChevronRight size={20} color="#71717a" />
                        </Animated.View>
                      </TouchableOpacity>

                      {/* Collapsible Sub-items */}
                      <Animated.View
                        style={[workspaceAnimatedStyle, { overflow: "hidden" }]}
                      >
                        {workspaceItems.map((item) => {
                          const IconComponent = item.icon;
                          const isLoading =
                            loadingStates[`create-${item.createType}`];

                          if (item.isCreateButton) {
                            return (
                              <TouchableOpacity
                                key={item.id}
                                onPress={() =>
                                  item.createType &&
                                  handleCreateAction(item.createType)
                                }
                                disabled={isLoading}
                                className="flex-row items-center px-6 py-4 active:bg-gray-100"
                                activeOpacity={0.7}
                                style={{
                                  paddingLeft: 48,
                                  opacity: isLoading ? 0.6 : 1,
                                }}
                              >
                                {isLoading ? (
                                  <ActivityIndicator
                                    size="small"
                                    color="#9ca3af"
                                  />
                                ) : (
                                  <IconComponent size={20} color="#9ca3af" />
                                )}
                                <Text className="text-muted-foreground text-sm font-medium ml-3">
                                  {item.title}
                                </Text>
                              </TouchableOpacity>
                            );
                          } else {
                            return (
                              <TouchableOpacity
                                key={item.id}
                                onPress={() => handleNavigate(item.route!)}
                                className="flex-row items-center px-6 py-4 active:bg-gray-100"
                                activeOpacity={0.7}
                                style={{ paddingLeft: 48 }}
                              >
                                <IconComponent size={20} color="#9ca3af" />
                                <Text className="text-muted-foreground text-sm font-medium ml-3">
                                  {item.title}
                                </Text>
                              </TouchableOpacity>
                            );
                          }
                        })}
                      </Animated.View>
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
                </Animated.View>
              </GestureDetector>
            </Pressable>
          </Animated.View>
        </GestureHandlerRootView>
      </Modal>

      {/* Tag Tree Modal - only render when needed */}
      <TagTreeModal
        visible={showTagTreeModal}
        onClose={() => setShowTagTreeModal(false)}
      />
    </View>
  );
}
