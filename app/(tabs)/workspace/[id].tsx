// app/(tabs)/workspace/[id].tsx - Simple placeholder
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Mock data - replace with real API calls later
const mockNotes: Record<string, any> = {
  "1": {
    id: "1",
    title: "Project Planning",
    content:
      "This is my project planning note.\n\nKey points:\n- Define scope\n- Set timeline\n- Assign resources",
  },
  "2": {
    id: "2",
    title: "Meeting Notes",
    content:
      "Today's meeting was productive.\n\nDiscussed:\n- Sprint goals\n- Testing strategy\n- Deployment timeline",
  },
  "3": {
    id: "3",
    title: "Random Ideas",
    content:
      "Collection of random thoughts and ideas.\n\n- App feature ideas\n- Business concepts\n- Technical improvements",
  },
};

export default function NoteEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    loadNote();
  }, [id]);

  const loadNote = async () => {
    try {
      setIsLoading(true);

      // Simulate loading delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const note = mockNotes[id as string];
      if (note) {
        setTitle(note.title);
        setContent(note.content);
      } else {
        console.log("Note not found:", id);
        setTitle("Note Not Found");
        setContent("This note could not be loaded.");
      }
    } catch (error) {
      console.error("Error loading note:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    console.log("Saving note:", { id, title, content });
    // TODO: Save to API

    // Show success feedback
    console.log("Note saved successfully!");
  };

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#18181b" />
          <Text className="text-muted-foreground mt-4">Loading note...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
        <TouchableOpacity
          onPress={handleBack}
          className="flex-row items-center"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#18181b" />
          <Text className="text-foreground ml-2">Back</Text>
        </TouchableOpacity>

        <Text className="text-foreground text-lg font-semibold">Edit Note</Text>

        <TouchableOpacity
          onPress={handleSave}
          className="bg-primary px-4 py-2 rounded-lg"
          activeOpacity={0.8}
        >
          <Text className="text-primary-foreground font-medium">Save</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View className="flex-1 p-6">
        {/* Note ID indicator */}
        <Text className="text-muted-foreground text-sm mb-4">
          Note ID: {id}
        </Text>

        {/* Title Input */}
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Note title..."
          className="text-foreground text-xl font-bold mb-4 p-2 border-b border-border"
          placeholderTextColor="#71717a"
        />

        {/* Content Input */}
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="Edit your note content..."
          className="text-foreground text-base flex-1 p-2"
          placeholderTextColor="#71717a"
          multiline={true}
          textAlignVertical="top"
        />

        {/* Placeholder for future rich text editor */}
        <View className="mt-4 p-4 bg-muted rounded-lg">
          <Text className="text-muted-foreground text-center text-sm">
            💡 Rich text editor will replace the TextInput above
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
