// app/(tabs)/workspace/_layout.tsx - Updated with flashcards button
import { Ionicons } from "@expo/vector-icons";
import * as Sentry from "@sentry/react-native";
import { Stack } from "expo-router";
import React, { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { FlashcardsModal } from "../../../components/FlashcardsModal";
import { PageInfoModal } from "../../../components/PageInfoModal";
import { TagTreeModal } from "../../../components/TagTreeModal";

export default function WorkspaceLayout() {
  const [showTagTree, setShowTagTree] = useState(false);
  const [showPageInfo, setShowPageInfo] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);
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

  // Handler for flashcards button
  const handleFlashcardsPress = (pageId: string) => {
    try {
      setCurrentPageId(pageId);
      setShowFlashcards(true);
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          component: "WorkspaceLayout",
          action: "flashcards_press",
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
      <View className="flex-row items-center gap-1">
        {/* Flashcards button */}
        <TouchableOpacity
          onPress={() => handleFlashcardsPress(pageId)}
          className="p-2 rounded-full"
          activeOpacity={0.7}
        >
          <Ionicons name="library-outline" size={24} color="#18181b" />
        </TouchableOpacity>

        {/* Page info button */}
        <TouchableOpacity
          onPress={() => handlePageInfoPress(pageId)}
          className="p-2 -mr-2"
          activeOpacity={0.7}
        >
          <Ionicons
            name="information-circle-outline"
            size={24}
            color="#18181b"
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: {
            backgroundColor: "#ffffff",
          },
          headerTintColor: "#18181b",
          headerTitleStyle: {
            fontWeight: "600",
            fontSize: 18,
          },
          headerShadowVisible: true,
        }}
      >
        <Stack.Screen
          name="pages/index"
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
          name="pages/[id]"
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

      {/* Flashcards Modal - Available for pages with pageId */}
      <FlashcardsModal
        visible={showFlashcards}
        onClose={() => setShowFlashcards(false)}
        pageId={currentPageId}
      />
    </>
  );
}
