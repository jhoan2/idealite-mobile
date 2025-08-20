import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, TextInput, View } from "react-native";
import { useDebounce } from "use-debounce";
import { pageRepository } from "../../db/pageRepository";
import { type Page } from "../../db/schema";
import { captureAndFormatError } from "../../lib/sentry/errorHandler";
import { useSyncStore } from "../../store/syncStore";

interface HeadingEditorProps {
  pageId: string;
  placeholder?: string;
}

// Helper function to check for invalid characters
function hasInvalidCharacters(title: string): {
  isValid: boolean;
  invalidChar?: string;
} {
  const invalidChars = ['"', "/", "\\", "*", "<", ">", ":", "|", "?"];
  for (const char of invalidChars) {
    if (title.includes(char)) {
      return { isValid: false, invalidChar: char };
    }
  }

  return { isValid: true };
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
  const [validationError, setValidationError] = useState<string | null>(null);
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
          setValidationError(null);
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
          console.error("HeadingEditor error:", errorMessage);
        }
      } catch (error) {
        const errorMessage = captureAndFormatError(error, {
          operation: "load page from SQLite",
          component: "HeadingEditor",
          level: "error",
          context: { pageId, pageIdNumber },
        });
        console.error("HeadingEditor error:", errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (pageIdNumber && !isNaN(pageIdNumber)) {
      loadPage();
    }
  }, [pageIdNumber, pageId]);

  // Validate title and return validation result
  const validateTitle = (
    titleToValidate: string
  ): { isValid: boolean; error?: string } => {
    const trimmed = titleToValidate.trim();

    if (!trimmed) {
      return { isValid: false, error: "Page title cannot be empty" };
    }

    if (trimmed.length > 200) {
      return { isValid: false, error: "Title cannot exceed 200 characters" };
    }

    const { isValid, invalidChar } = hasInvalidCharacters(trimmed);
    if (!isValid) {
      return {
        isValid: false,
        error: `Title cannot contain the character: ${invalidChar}`,
      };
    }

    return { isValid: true };
  };

  // Save to SQLite with validation
  const saveTitle = async (newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed || trimmed === lastSavedTitle.current || !page) return;

    // Validate the title
    const validation = validateTitle(trimmed);
    if (!validation.isValid) {
      setValidationError(validation.error!);
      setTitle(lastSavedTitle.current); // Reset to last saved
      return;
    }

    try {
      setIsUpdating(true);
      setValidationError(null); // Clear any existing errors

      // Use the method that handles unique titles
      const updatedPage = await pageRepository.updatePageWithUniqueTitle(
        pageIdNumber,
        trimmed
      );

      // Update local state with the final title (which might have a number appended)
      setPage(updatedPage);
      setTitle(updatedPage.title); // Update the input to show the final title
      lastSavedTitle.current = updatedPage.title;
      setHasUnsavedChanges(false);

      // Get fresh page data from SQLite before queuing sync
      const freshPage = await pageRepository.findById(pageIdNumber);
      if (freshPage) {
        // Proper operation type determination
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
      setValidationError("Failed to save title. Please try again.");
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

    // Clear validation error if the new title is valid
    if (validationError) {
      const validation = validateTitle(newTitle);
      if (validation.isValid) {
        setValidationError(null);
      }
    }
  };

  // Handle blur - validate immediately
  const handleBlur = () => {
    if (title.trim()) {
      const validation = validateTitle(title);
      if (!validation.isValid) {
        setValidationError(validation.error!);
        return;
      }
    }
    saveTitle(title);
  };

  // Handle submit - validate immediately
  const handleSubmit = () => {
    const validation = validateTitle(title);
    if (!validation.isValid) {
      setValidationError(validation.error!);
      return;
    }
    saveTitle(title);
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

  const hasValidationError = !!validationError;

  return (
    <View className="px-4 py-3 border-b border-border bg-background">
      <View className="flex-row items-center">
        <TextInput
          value={title}
          onChangeText={handleTextChange}
          onBlur={handleBlur}
          onSubmitEditing={handleSubmit}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          className={`text-xl font-bold bg-transparent flex-1 ${
            hasValidationError
              ? "text-red-600 border-red-500"
              : "text-foreground"
          }`}
          style={{
            borderWidth: hasValidationError ? 1 : 0,
            borderColor: hasValidationError ? "#ef4444" : "transparent",
            borderRadius: 4,
            paddingHorizontal: hasValidationError ? 8 : 0,
            paddingVertical: hasValidationError ? 4 : 0,
          }}
          autoCapitalize="sentences"
          returnKeyType="done"
          maxLength={200}
          editable={!isUpdating}
        />

        {/* Show saving indicator */}
        {(isUpdating || hasUnsavedChanges) && !hasValidationError && (
          <View className="ml-2">
            {isUpdating ? (
              <ActivityIndicator size="small" color="#9CA3AF" />
            ) : (
              <View className="w-2 h-2 bg-yellow-500 rounded-full" />
            )}
          </View>
        )}
      </View>

      {/* Error message */}
      {hasValidationError && (
        <View className="mt-2">
          <Text className="text-red-600 text-sm">{validationError}</Text>
        </View>
      )}
    </View>
  );
};

export default HeadingEditor;
