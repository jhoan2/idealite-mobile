import { RichText, Toolbar, useEditorBridge } from "@10play/tentap-editor";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ErrorScreen } from "../../../components/ErrorScreen";
import { LoadingScreen } from "../../../components/LoadingScreen";
import HeadingEditor from "../../../components/page/HeadingEditor";
import { editorHtml } from "../../../editor-web/build/editorHtml";
import { usePage } from "../../../hooks/page/usePage";

export default function NoteEditorScreen() {
  const { id: pageId } = useLocalSearchParams<{ id: string }>();

  // Single fetch for page data
  const { page, isLoading, error, refetch, updatePage } = usePage(pageId!);

  const editor = useEditorBridge({
    customSource: editorHtml,
    autofocus: false,
    avoidIosKeyboard: true,
    initialContent: "<p>Start writing...</p>",
  });

  // Update editor content when page loads
  useEffect(() => {
    if (page?.content && editor) {
      editor.setContent(page.content);
    }
  }, [page?.content, editor]);

  // Loading state
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Error state
  if (error || !page) {
    return (
      <ErrorScreen
        message={error?.message || "Page not found"}
        onRetry={refetch}
      />
    );
  }

  // Canvas vs Page content
  const renderContent = () => {
    if (page.content_type === "canvas") {
      // For MVP, canvas uses same editor but could be different later
      return (
        <View style={styles.canvasContainer}>
          <Text className="text-muted-foreground text-center p-4">
            Canvas editing coming soon...
          </Text>
          {/* For now, still show the rich text editor */}
          <RichText editor={editor} style={styles.editor} />
        </View>
      );
    }

    // Regular page editor
    return <RichText editor={editor} style={styles.editor} />;
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* Title Editor */}
      <HeadingEditor pageId={pageId!} placeholder="Enter page title..." />

      {/* Content Editor - conditionally rendered based on type */}
      {renderContent()}

      {/* Toolbar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.toolbarContainer}
      >
        <Toolbar editor={editor} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  editor: { flex: 1 },
  canvasContainer: { flex: 1 },
  toolbarContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
});
