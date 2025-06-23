// components/page/BodyEditor.tsx
import { RichText, Toolbar, useEditorBridge } from "@10play/tentap-editor";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { editorHtml } from "../../editor-web/build/editorHtml";
import { usePage } from "../../hooks/page/usePage";

interface BodyEditorProps {
  pageId: string;
  initialContent: string;
}

export default function BodyEditor({
  pageId,
  initialContent,
}: BodyEditorProps) {
  const { updatePage, isUpdating } = usePage(pageId);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditorBridge({
    customSource: editorHtml,
    autofocus: false,
    avoidIosKeyboard: true,
    initialContent,
    onChange: () => {
      setHasUnsaved(true);

      // clear any pending save
      if (debounceRef.current) clearTimeout(debounceRef.current);

      // schedule a save 2s after typing stops
      debounceRef.current = setTimeout(async () => {
        try {
          const html = await editor.getHTML();
          await updatePage({ content: html });
          setHasUnsaved(false);
        } catch (err) {
          console.error("Body auto-save failed", err);
          // you can Alert here if you like
        }
      }, 2000);
    },
  });

  return (
    <View style={styles.container}>
      {(isUpdating || hasUnsaved) && (
        <View style={styles.indicator}>
          <ActivityIndicator size="small" />
        </View>
      )}
      <RichText editor={editor} style={styles.editor} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.toolbar}
      >
        <Toolbar editor={editor} />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  editor: { flex: 1 },
  toolbar: {
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  indicator: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
  },
});
