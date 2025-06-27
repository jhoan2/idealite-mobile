// components/canvas/MobileCanvasEditor.tsx
import React from "react";
import { Alert, View } from "react-native";
import DomTldrawCanvas from "./DomTldrawCanvas";

interface MobileCanvasEditorProps {
  pageId: string;
  initialContent?: any;
}

export default function MobileCanvasEditor({
  pageId,
  initialContent,
}: MobileCanvasEditorProps) {
  // Canvas save (placeholder for now)
  const handleCanvasSave = async () => {
    Alert.alert(
      "Canvas Save",
      "Canvas save button clicked! (Implementation coming next)",
      [{ text: "OK" }]
    );
  };

  return (
    <View className="flex-1">
      <DomTldrawCanvas pageId={pageId} initialContent={initialContent} />
    </View>
  );
}
