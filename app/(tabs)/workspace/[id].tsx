import { RichText, Toolbar, useEditorBridge } from "@10play/tentap-editor";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
} from "react-native";
import { editorHtml } from "../../../editor-web/build/editorHtml";

export default function NoteEditorScreen() {
  const editor = useEditorBridge({
    customSource: editorHtml,
    // bridgeExtensions: [
    //   // TODO: Add your custom bridges when you create them:
    //   // FlashcardBridge,
    //   // ImageFlashcardBridge,
    // ],
    autofocus: true,
    avoidIosKeyboard: true,
    initialContent: "<p>something something</p>",
  });

  return (
    <SafeAreaView style={styles.screen}>
      <RichText editor={editor} style={styles.editor} />

      {/* Overlay toolbar above keyboard */}
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
  screen: { flex: 1 }, // <— critical
  editor: { flex: 1 }, // lets WebView fill remaining space
  toolbarContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
});
