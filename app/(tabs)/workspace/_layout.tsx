// app/(tabs)/workspace/_layout.tsx - Updated with right header button
import { Ionicons } from "@expo/vector-icons";
import * as Sentry from "@sentry/react-native";
import { Stack } from "expo-router";
import React, { useState } from "react";
import { TouchableOpacity } from "react-native";
import { PageInfoModal } from "../../../components/PageInfoModal";
import { TagTreeModal } from "../../../components/TagTreeModal";

export default function WorkspaceLayout() {
  const [showTagTree, setShowTagTree] = useState(false);
  const [showPageInfo, setShowPageInfo] = useState(false);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);

  // Handler for menu button
  const handleMenuPress = () => {
    try {
      setShowTagTree(true);
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          component: "WorkspaceLayout",
          action: "menu_press",
        },
      });
    }
  };

  // Handler for page info button
  const handlePageInfoPress = (pageId: string) => {
    try {
      setCurrentPageId(pageId);
      setShowPageInfo(true);
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          component: "WorkspaceLayout",
          action: "page_info_press",
        },
      });
    }
  };

  // Common header left component
  const HeaderLeft = () => (
    <TouchableOpacity
      onPress={handleMenuPress}
      className="p-2 -ml-2"
      activeOpacity={0.7}
    >
      <Ionicons name="menu-outline" size={24} color="#18181b" />
    </TouchableOpacity>
  );

  // Header right component for pages with pageId
  const HeaderRight = ({ pageId }: { pageId?: string }) => {
    if (!pageId) return null;

    return (
      <TouchableOpacity
        onPress={() => handlePageInfoPress(pageId)}
        className="p-2 -mr-2"
        activeOpacity={0.7}
      >
        <Ionicons name="information-circle-outline" size={24} color="#18181b" />
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: "#ffffff",
          },
          headerTintColor: "#18181b",
          headerTitleStyle: {
            fontWeight: "600",
            fontSize: 18,
          },
          headerShadowVisible: true,
          headerLeft: () => <HeaderLeft />,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: " ",
          }}
        />
        <Stack.Screen
          name="canvas/[id]"
          options={({ route }) => {
            const { id } = route.params as { id: string };
            return {
              title: " ",
              presentation: "card",
              headerBackTitle: "Back",
              headerRight: () => <HeaderRight pageId={id} />,
            };
          }}
        />
        <Stack.Screen
          name="[id]"
          options={({ route }) => {
            const { id } = route.params as { id: string };
            return {
              title: " ",
              presentation: "card",
              headerBackTitle: "Back",
              headerRight: () => <HeaderRight pageId={id} />,
            };
          }}
        />
      </Stack>

      {/* Tag Tree Modal - Available from all workspace screens */}
      <TagTreeModal
        visible={showTagTree}
        onClose={() => setShowTagTree(false)}
      />

      {/* Page Info Modal - Available for pages with pageId */}
      <PageInfoModal
        visible={showPageInfo}
        onClose={() => setShowPageInfo(false)}
        pageId={currentPageId}
      />
    </>
  );
}
