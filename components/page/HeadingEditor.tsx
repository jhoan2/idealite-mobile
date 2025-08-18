import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, TextInput, View } from "react-native";
import { useDebounce } from "use-debounce";
import { pageRepository } from "../../db/pageRepository";
import { type Page } from "../../db/schema";
import { captureAndFormatError } from "../../lib/sentry/errorHandler";
import { useSyncStore } from "../../store/syncStore";

interface HeadingEditorProps {
  pageId: string;
  placeholder?: string;
}

const HeadingEditor: React.FC<HeadingEditorProps> = ({
  pageId,
  placeholder = "Loading...",
}) => {
  const [page, setPage] = useState<Page | null>(null);
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const lastSavedTitle = useRef<string>("");

  // Debounce the title for automatic saving
  const [debouncedTitle] = useDebounce(title, 800);

  // Convert pageId to number
  const pageIdNumber = parseInt(pageId);

  // Load page from SQLite
  useEffect(() => {
    const loadPage = async () => {
      try {
        setIsLoading(true);
        const localPage = await pageRepository.findById(pageIdNumber);

        if (localPage) {
          setPage(localPage);
          setTitle(localPage.title);
          lastSavedTitle.current = localPage.title;
          setHasUnsavedChanges(false);
        } else {
          // Page should exist since AllPagesScreen creates it before navigation
          const errorMessage = captureAndFormatError(
            new Error(`Page not found with ID: ${pageIdNumber}`),
            {
              operation: "load page",
              component: "HeadingEditor",
              level: "error",
              context: { pageId, pageIdNumber },
            }
          );
          Alert.alert("Error", errorMessage);
        }
      } catch (error) {
        const errorMessage = captureAndFormatError(error, {
          operation: "load page from SQLite",
          component: "HeadingEditor",
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
    }
  }, [pageIdNumber, pageId]);

  // Save to SQLite and queue sync
  const saveTitle = async (newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed || trimmed === lastSavedTitle.current || !page) return;

    // User-facing validation
    if (!trimmed) {
      Alert.alert("Invalid Title", "Page title cannot be empty");
      setTitle(lastSavedTitle.current); // Reset to last saved
      return;
    }

    if (trimmed.length > 200) {
      Alert.alert("Title Too Long", "Title cannot exceed 200 characters");
      return;
    }

    try {
      setIsUpdating(true);

      // Save to local SQLite
      const updatedPage = await pageRepository.updatePage(pageIdNumber, {
        title: trimmed,
      });

      // Update local state
      setPage(updatedPage);
      lastSavedTitle.current = trimmed;
      setHasUnsavedChanges(false);

      // Get fresh page data from SQLite before queuing sync
      const freshPage = await pageRepository.findById(pageIdNumber);
      if (freshPage) {
        // Queue sync operation with complete current page state
        useSyncStore.getState().queueOperation({
          operationType: "update",
          localId: pageIdNumber,
          serverId: freshPage.server_id,
          data: {
            title: freshPage.title,
            updated_at: new Date().toISOString(),
          },
        });
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      const errorMessage = captureAndFormatError(error, {
        operation: "save page title",
        component: "HeadingEditor",
        level: "error",
        context: {
          pageId,
          pageIdNumber,
          oldTitle: lastSavedTitle.current,
          newTitle: trimmed,
          hasServerID: !!page?.server_id,
        },
      });
      Alert.alert("Error", errorMessage);
      setTitle(lastSavedTitle.current);
    } finally {
      setIsUpdating(false);
    }
  };

  // Save whenever the debounced value changes
  useEffect(() => {
    if (
      debouncedTitle.trim() &&
      debouncedTitle.trim() !== lastSavedTitle.current &&
      page
    ) {
      saveTitle(debouncedTitle);
    }
  }, [debouncedTitle, page]);

  // Handle text change
  const handleTextChange = (newTitle: string) => {
    setTitle(newTitle);
    setHasUnsavedChanges(newTitle.trim() !== lastSavedTitle.current);
  };

  // Show loading state while fetching page data
  if (isLoading) {
    return (
      <View className="px-4 py-3 border-b border-border flex-row items-center">
        <ActivityIndicator size="small" color="#9CA3AF" />
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          className="text-xl font-bold text-foreground bg-transparent ml-2 flex-1"
          editable={false}
        />
      </View>
    );
  }

  return (
    <View className="px-4 py-3 border-b border-border bg-background">
      <View className="flex-row items-center">
        <TextInput
          value={title}
          onChangeText={handleTextChange}
          onBlur={() => saveTitle(title)}
          onSubmitEditing={() => saveTitle(title)}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          className="text-xl font-bold text-foreground bg-transparent flex-1"
          autoCapitalize="sentences"
          returnKeyType="done"
          maxLength={200}
          editable={!isUpdating}
        />

        {/* Show saving indicator */}
        {(isUpdating || hasUnsavedChanges) && (
          <View className="ml-2">
            {isUpdating ? (
              <ActivityIndicator size="small" color="#9CA3AF" />
            ) : (
              <View className="w-2 h-2 bg-yellow-500 rounded-full" />
            )}
          </View>
        )}
      </View>
    </View>
  );
};

export default HeadingEditor;
