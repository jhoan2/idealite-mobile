import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, TextInput, View } from "react-native";
import { useDebounce } from "use-debounce";
import { usePage } from "../../hooks/page/usePage";

interface HeadingEditorProps {
  pageId: string;
  placeholder?: string;
}

const HeadingEditor: React.FC<HeadingEditorProps> = ({
  pageId,
  placeholder = "Loading...",
}) => {
  const { page, isLoading, updatePage, isUpdating } = usePage(pageId);
  const [title, setTitle] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const lastSavedTitle = useRef<string>("");

  // Debounce the title for automatic saving
  const [debouncedTitle] = useDebounce(title, 800);

  // Update local title when page data loads
  useEffect(() => {
    if (page?.title) {
      setTitle(page.title);
      lastSavedTitle.current = page.title;
      setHasUnsavedChanges(false);
    }
  }, [page?.title]);

  // Save to server
  const saveTitle = async (newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed || trimmed === lastSavedTitle.current) return;

    try {
      await updatePage({ title: trimmed });
      lastSavedTitle.current = trimmed;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not save title.");
      setTitle(lastSavedTitle.current);
    }
  };

  // whenever the debounced value changes, save it
  useEffect(() => {
    if (
      debouncedTitle.trim() &&
      debouncedTitle.trim() !== lastSavedTitle.current
    ) {
      saveTitle(debouncedTitle);
    }
  }, [debouncedTitle]);

  // handleTextChange just sets the title
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
    <View className="px-4 py-3 border-b border-border">
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
