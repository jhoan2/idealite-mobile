// Debug BodyEditor - Fixed initialization issue
import {
  DEFAULT_TOOLBAR_ITEMS,
  RichText,
  TenTapStartKit,
  Toolbar,
  useEditorBridge,
} from "@10play/tentap-editor";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useDebounce } from "use-debounce";
import { pageRepository } from "../../db/pageRepository";
import { type Page } from "../../db/schema";
import { useApiClient } from "../../lib/api/client";
import { captureAndFormatError } from "../../lib/sentry/errorHandler";
import { useSyncStore } from "../../store/syncStore";
import { createFlashcardItem } from "./toolbar/FlashcardToolbarItem";
import { createImageUploadItem } from "./toolbar/ImageUploadItem";

import { BlockquoteWithIds } from "./extensions/BlockquoteWithIds";
import { BulletListWithIds } from "./extensions/BulletListWithIds";
import { CodeBlockWithIds } from "./extensions/CodeBlockWithIds";
import { HeadingWithIds } from "./extensions/HeadingWithIds";
import { ImageWithIds } from "./extensions/ImageWithIds";
import { ListItemWithIds } from "./extensions/ListItemWithIds";
import { OrderedListWithIds } from "./extensions/OrderedListWithIds";
import { ParagraphWithIds } from "./extensions/ParagraphWithIds";
import { TaskItemWithIds } from "./extensions/TaskItemWithIds";
import { TaskListWithIds } from "./extensions/TaskListWithIds";

interface BodyEditorProps {
  pageId: string;
  initialContent: string;
}

export default function BodyEditor({
  pageId,
  initialContent,
}: BodyEditorProps) {
  const api = useApiClient();

  const [page, setPage] = useState<Page | null>(null);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const lastSavedContent = useRef<string>("");

  // NEW: Track if we've initialized the editor content
  const hasInitialized = useRef(false);

  const [debouncedContent] = useDebounce(content, 2000);

  // Convert pageId to number
  const pageIdNumber = parseInt(pageId);

  const editor = useEditorBridge({
    bridgeExtensions: [
      ...TenTapStartKit,
      ParagraphWithIds,
      HeadingWithIds,
      ListItemWithIds,
      BlockquoteWithIds,
      CodeBlockWithIds,
      ImageWithIds,
      OrderedListWithIds,
      TaskListWithIds,
      TaskItemWithIds,
      BulletListWithIds,
    ],

    autofocus: false,
    avoidIosKeyboard: true,
    initialContent,
    onChange: async () => {
      try {
        const html = await editor.getHTML();
        setContent(html);
        setHasUnsavedChanges(true);
      } catch (err) {
        console.error("Failed to get editor content", err);
      }
    },
  });

  // Load page from database
  useEffect(() => {
    const loadPage = async () => {
      try {
        setIsLoading(true);
        const localPage = await pageRepository.findById(pageIdNumber);

        if (localPage) {
          setPage(localPage);
          const pageContent = localPage.content || initialContent;
          setContent(pageContent);
          lastSavedContent.current = pageContent;
          setHasUnsavedChanges(false);
        } else {
          console.error("Page not found with ID:", pageIdNumber);
          const errorMessage = captureAndFormatError(
            new Error(`Page not found with ID: ${pageIdNumber}`),
            {
              operation: "load page",
              component: "BodyEditor",
              level: "error",
              context: { pageId, pageIdNumber },
            }
          );
          Alert.alert("Error", errorMessage);
        }
      } catch (error) {
        console.error("Error loading page:", error);
        const errorMessage = captureAndFormatError(error, {
          operation: "load page from SQLite",
          component: "BodyEditor",
          level: "error",
          context: { pageId, pageIdNumber },
        });
        Alert.alert("Error", errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (pageIdNumber && !isNaN(pageIdNumber)) {
      loadPage();
    } else {
      console.error("Invalid pageIdNumber:", pageIdNumber);
      setIsLoading(false);
    }
  }, [pageIdNumber, pageId, initialContent]);

  // FIXED: Only initialize editor content once when page loads
  useEffect(() => {
    if (page?.content && !hasInitialized.current) {
      editor.setContent(page.content);
      setContent(page.content);
      lastSavedContent.current = page.content;
      hasInitialized.current = true;
    }
  }, [page?.content, editor]);

  // Save function
  const saveContent = async (newContent: string) => {
    if (!newContent || newContent === lastSavedContent.current || !page) {
      return;
    }

    try {
      setIsUpdating(true);

      const updatedPage = await pageRepository.updatePage(pageIdNumber, {
        content: newContent,
      });
      setPage(updatedPage);
      lastSavedContent.current = newContent;
      setHasUnsavedChanges(false);

      // FIXED: Proper operation type determination
      const freshPage = await pageRepository.findById(pageIdNumber);
      if (freshPage) {
        const operationType = freshPage.server_id ? "update" : "create";

        useSyncStore.getState().queueOperation({
          operationType,
          localId: pageIdNumber,
          serverId: freshPage.server_id,
          data:
            operationType === "create"
              ? {
                  // For create operations, include all required fields
                  title: freshPage.title,
                  content: freshPage.content,
                  content_type: freshPage.content_type,
                  canvas_image_cid: freshPage.canvas_image_cid,
                  description: freshPage.description,
                  image_previews: freshPage.image_previews,
                  created_at: freshPage.created_at,
                  updated_at: new Date().toISOString(),
                  deleted: freshPage.deleted,
                }
              : {
                  // For update operations, only include changed fields
                  content: freshPage.content,
                  updated_at: new Date().toISOString(),
                },
        });
      }
    } catch (error) {
      const errorMessage = captureAndFormatError(error, {
        operation: "save page content",
        component: "BodyEditor",
        level: "error",
        context: {
          pageId,
          pageIdNumber,
          hasServerID: !!page?.server_id,
        },
      });
      Alert.alert("Error", errorMessage);
      setContent(lastSavedContent.current);
    } finally {
      setIsUpdating(false);
    }
  };

  // Auto-save when content changes
  useEffect(() => {
    if (
      debouncedContent &&
      debouncedContent !== lastSavedContent.current &&
      page &&
      hasInitialized.current // Only save after we've initialized
    ) {
      saveContent(debouncedContent);
    }
  }, [debouncedContent, page]);

  const qaItem = createFlashcardItem("question-answer", editor, pageId, api);
  const clozeItem = createFlashcardItem("cloze", editor, pageId, api);
  const uploadItem = createImageUploadItem(editor);

  return (
    <View style={styles.container}>
      {(isUpdating || hasUnsavedChanges) && (
        <View style={styles.indicator}>
          {isUpdating ? (
            <ActivityIndicator size="small" color="#9CA3AF" />
          ) : (
            <View style={styles.unsavedDot} />
          )}
        </View>
      )}

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Loading page...</Text>
        </View>
      )}

      <RichText editor={editor} style={styles.editor} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.toolbar}
      >
        <Toolbar
          editor={editor}
          items={[qaItem, clozeItem, uploadItem, ...DEFAULT_TOOLBAR_ITEMS]}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  editor: { flex: 1 },
  toolbar: {
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  loadingContainer: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 20,
    zIndex: 100,
  },
  indicator: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
  },
  unsavedDot: {
    width: 8,
    height: 8,
    backgroundColor: "#EAB308",
    borderRadius: 4,
  },
});
