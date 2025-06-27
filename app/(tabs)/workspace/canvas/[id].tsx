// app/(tabs)/workspace/canvas/[id].tsx
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { ActivityIndicator, Text, View } from "react-native";

import MobileCanvasEditor from "../../../../components/canvas/MobileCanvasEditor";
import { useApiClient } from "../../../../lib/api/client";

interface PageData {
  id: string;
  title: string;
  content: string | null;
  content_type: "page" | "canvas";
  updated_at: string | null;
}

export default function CanvasScreen() {
  const { id: pageId } = useLocalSearchParams<{ id: string }>();
  const apiClient = useApiClient();

  // Fetch page data
  const {
    data: pageData,
    isLoading,
    error,
  } = useQuery<PageData>({
    queryKey: ["page", pageId],
    queryFn: async () => {
      if (!pageId) throw new Error("Page ID is required");
      const response = await apiClient.get(`/api/v1/pages/${pageId}`);
      return response;
    },
    enabled: !!pageId,
  });

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
      <View className="flex-1">
        <MobileCanvasEditor
          pageId={pageId!}
          initialContent={initialContent}
          title={pageData.title}
        />
      </View>
    </>
  );
}
