// app/(tabs)/workspace/_layout.tsx - Updated to show menu on all screens
import { Ionicons } from "@expo/vector-icons";
import * as Sentry from "@sentry/react-native";
import { Stack } from "expo-router";
import React, { useState } from "react";
import { TouchableOpacity } from "react-native";
import { TagTreeModal } from "../../../components/TagTreeModal";

export default function WorkspaceLayout() {
  const [showTagTree, setShowTagTree] = useState(false);

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

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: true, // Enable headers - they handle safe areas automatically
          headerStyle: {
            backgroundColor: "#ffffff",
          },
          headerTintColor: "#18181b",
          headerTitleStyle: {
            fontWeight: "600",
            fontSize: 18,
          },
          headerShadowVisible: true,
          // Add menu button to ALL screens by default
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
          name="[id]"
          options={{
            title: " ",
            // Hide tab bar when editing notes
            presentation: "card",
            // Menu button is already inherited from screenOptions
            // Just need to customize the back button
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="new"
          options={{
            title: "New Note",
            presentation: "modal", // Present as modal for creating new notes
            // For modal screens, you might want to customize this differently
            headerLeft: () => <HeaderLeft />,
          }}
        />
      </Stack>

      {/* Tag Tree Modal - Available from all workspace screens */}
      <TagTreeModal
        visible={showTagTree}
        onClose={() => setShowTagTree(false)}
      />
    </>
  );
}
