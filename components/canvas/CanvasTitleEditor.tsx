// components/canvas/CanvasTitleEditor.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useDebounce } from "use-debounce";
import { usePage } from "../../hooks/page/usePage";

interface CanvasTitleEditorProps {
  pageId: string;
  initialTitle: string;
  onCanvasSave?: () => void;
}

export default function CanvasTitleEditor({
  pageId,
  initialTitle,
  onCanvasSave,
}: CanvasTitleEditorProps) {
  const { updatePage, isUpdating } = usePage(pageId);

  // Title editing state (same pattern as HeadingEditor)
  const [title, setTitle] = useState(initialTitle);
  const [hasUnsavedTitleChanges, setHasUnsavedTitleChanges] = useState(false);
  const lastSavedTitle = useRef<string>(initialTitle);

  // Debounce the title for automatic saving
  const [debouncedTitle] = useDebounce(title, 800);

  // Update local title when prop changes
  useEffect(() => {
    setTitle(initialTitle);
    lastSavedTitle.current = initialTitle;
    setHasUnsavedTitleChanges(false);
  }, [initialTitle]);

  // Save title to server
  const saveTitle = async (newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed || trimmed === lastSavedTitle.current) return;

    try {
      await updatePage({ title: trimmed });
      lastSavedTitle.current = trimmed;
      setHasUnsavedTitleChanges(false);
    } catch (err) {
      console.error("Failed to save title:", err);
      Alert.alert("Error", "Could not save title.");
      setTitle(lastSavedTitle.current);
    }
  };

  // Auto-save when debounced value changes
  useEffect(() => {
    if (
      debouncedTitle.trim() &&
      debouncedTitle.trim() !== lastSavedTitle.current
    ) {
      saveTitle(debouncedTitle);
    }
  }, [debouncedTitle]);

  // Handle title text change
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setHasUnsavedTitleChanges(newTitle.trim() !== lastSavedTitle.current);
  };

  return (
    <View className="flex-row items-center justify-between px-4 py-3 border-b border-border bg-background">
      {/* Editable title */}
      <View className="flex-1 flex-row items-center mr-4">
        <TextInput
          value={title}
          onChangeText={handleTitleChange}
          onBlur={() => saveTitle(title)}
          onSubmitEditing={() => saveTitle(title)}
          placeholder="Canvas title..."
          placeholderTextColor="#9CA3AF"
          className="text-lg font-semibold text-foreground bg-transparent flex-1"
          autoCapitalize="sentences"
          returnKeyType="done"
          maxLength={200}
          editable={!isUpdating}
        />

        {/* Title save indicator */}
        {(isUpdating || hasUnsavedTitleChanges) && (
          <View className="ml-2">
            {isUpdating ? (
              <ActivityIndicator size="small" color="#9CA3AF" />
            ) : (
              <View className="w-2 h-2 bg-yellow-500 rounded-full" />
            )}
          </View>
        )}
      </View>

      {/* Canvas save button */}
      {onCanvasSave && (
        <TouchableOpacity
          className="bg-blue-600 px-3 py-2 rounded"
          onPress={onCanvasSave}
        >
          <Text className="text-white text-sm">Save</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
