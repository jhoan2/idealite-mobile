// components/canvas/MobileCanvasEditor.tsx
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import DomTldrawCanvas from "./DomTldrawCanvas";

interface MobileCanvasEditorProps {
  pageId: string;
  initialContent?: any;
  title: string;
}

export default function MobileCanvasEditor({
  pageId,
  initialContent,
  title,
}: MobileCanvasEditorProps) {
  return (
    <View style={styles.container}>
      {/* Simple header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* Canvas */}
      <View style={styles.canvasContainer}>
        <DomTldrawCanvas pageId={pageId} initialContent={initialContent} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#18181b",
  },
  canvasContainer: {
    flex: 1,
  },
});
