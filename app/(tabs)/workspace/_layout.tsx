// app/(tabs)/workspace/_layout.tsx - Stack navigator for workspace with menu button
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
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "Workspace",
            // Left side menu button
            headerLeft: () => (
              <TouchableOpacity
                onPress={handleMenuPress}
                className="p-2 -ml-2"
                activeOpacity={0.7}
              >
                <Ionicons name="menu-outline" size={24} color="#18181b" />
              </TouchableOpacity>
            ),
          }}
        />
        <Stack.Screen
          name="[id]"
          options={{
            title: "Edit Note",
            // Hide tab bar when editing notes
            presentation: "card",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="new"
          options={{
            title: "New Note",
            presentation: "modal", // Present as modal for creating new notes
          }}
        />
      </Stack>

      {/* Tag Tree Modal */}
      <TagTreeModal
        visible={showTagTree}
        onClose={() => setShowTagTree(false)}
      />
    </>
  );
}
