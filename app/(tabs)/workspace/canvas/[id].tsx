// app/workspace/canvas/[id].tsx
import { useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { SafeAreaView, Text, View } from "react-native";
import SimpleCanvasWebView from "../../../../components/canvas/SimpleCanvas";

export default function SimpleCanvasTestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <>
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1 bg-background">
        {/* Simple header */}
        <View className="px-4 py-3 border-b border-border bg-background">
          <Text className="text-lg font-semibold text-foreground">
            Simple Canvas Test
          </Text>
        </View>

        {/* Canvas WebView */}
        <SimpleCanvasWebView pageId={id} />
      </SafeAreaView>
    </>
  );
}
