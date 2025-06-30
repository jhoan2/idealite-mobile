// app/workspace/canvas/[id].tsx
import { useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { SafeAreaView } from "react-native";
import CanvasTitleEditor from "../../../../components/canvas/CanvasTitleEditor";
import SimpleCanvasWebView from "../../../../components/canvas/SimpleCanvas";

export default function SimpleCanvasTestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <>
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1 bg-background">
        <CanvasTitleEditor pageId={id!} />

        {/* Canvas WebView */}
        <SimpleCanvasWebView pageId={id} />
      </SafeAreaView>
    </>
  );
}
