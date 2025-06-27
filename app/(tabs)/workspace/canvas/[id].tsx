// app/(tabs)/workspace/canvas/[id].tsx
import { useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Text,
  View,
} from "react-native";

import CanvasTitleEditor from "../../../../components/canvas/CanvasTitleEditor";
import MobileCanvasEditor from "../../../../components/canvas/MobileCanvasEditor";
import { usePage } from "../../../../hooks/page/usePage";

export default function CanvasScreen() {
  const { id: pageId } = useLocalSearchParams<{ id: string }>();

  // Use the same usePage hook as regular pages (consistent cache)
  const { page: pageData, isLoading, error } = usePage(pageId!);

  // Canvas save handler (placeholder)
  const handleCanvasSave = () => {
    Alert.alert("Canvas Save", "Canvas save functionality coming next!", [
      { text: "OK" },
    ]);
  };

  // Loading state
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-muted-foreground">Loading canvas...</Text>
      </View>
    );
  }

  // Error state
  if (error || !pageData) {
    return (
      <View className="flex-1 justify-center items-center bg-background px-6">
        <Text className="text-xl font-semibold text-foreground mb-2">
          Unable to Load Canvas
        </Text>
        <Text className="text-muted-foreground text-center">
          There was a problem loading the canvas. Please try again.
        </Text>
      </View>
    );
  }

  // Check if it's a canvas page
  if (pageData.content_type !== "canvas") {
    return (
      <View className="flex-1 justify-center items-center bg-background px-6">
        <Text className="text-xl font-semibold text-foreground mb-2">
          Invalid Page Type
        </Text>
        <Text className="text-muted-foreground text-center">
          This page is not a canvas.
        </Text>
      </View>
    );
  }

  // Parse canvas content
  let initialContent = null;
  if (pageData.content) {
    try {
      initialContent = JSON.parse(pageData.content);
    } catch (parseError) {
      console.error("Failed to parse canvas content:", parseError);
      // Just use null if parsing fails - canvas will start empty
    }
  }

  return (
    <>
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1 bg-background">
        {/* Title Editor - separate component, won't affect canvas */}
        <CanvasTitleEditor
          pageId={pageId!}
          initialTitle={pageData.title}
          onCanvasSave={handleCanvasSave}
        />

        {/* Canvas Editor - isolated, won't re-render when title changes */}
        <MobileCanvasEditor pageId={pageId!} initialContent={initialContent} />
      </SafeAreaView>
    </>
  );
}
