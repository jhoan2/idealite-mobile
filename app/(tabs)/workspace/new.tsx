// app/(tabs)/workspace/new.tsx - Simple placeholder
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function NewNoteScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSave = () => {
    console.log("Saving new note:", { title, content });
    // TODO: Save to API

    // For now, just go back to workspace
    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
        <TouchableOpacity
          onPress={handleCancel}
          className="flex-row items-center"
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color="#18181b" />
          <Text className="text-foreground ml-2">Cancel</Text>
        </TouchableOpacity>

        <Text className="text-foreground text-lg font-semibold">New Note</Text>

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
          placeholder="Start writing your note..."
          className="text-foreground text-base flex-1 p-2"
          placeholderTextColor="#71717a"
          multiline={true}
          textAlignVertical="top"
        />

        {/* Placeholder for future rich text editor */}
        <View className="mt-4 p-4 bg-muted rounded-lg">
          <Text className="text-muted-foreground text-center text-sm">
            💡 Rich text editor will go here
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
