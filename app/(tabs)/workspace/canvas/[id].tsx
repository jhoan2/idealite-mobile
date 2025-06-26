// app/(tabs)/workspace/canvas/[id].tsx
import { StatusBar } from "expo-status-bar";
import React from "react";
import { View } from "react-native";
import MobileCanvasEditor from "../../../../components/canvas/MobileCanvasEditor";

export default function CanvasScreen() {
  return (
    <>
      <StatusBar style="dark" />
      <View style={{ flex: 1 }}>
        <MobileCanvasEditor
          pageId="test-canvas-123"
          initialContent={null}
          title="Test Canvas"
        />
      </View>
    </>
  );
}
