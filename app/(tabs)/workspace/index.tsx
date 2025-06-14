// app/(tabs)/workspace/index.tsx - Main workspace screen
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Mock data - replace with real data from your API
const mockNotes = [
  {
    id: "1",
    title: "Project Planning",
    content: "Initial thoughts on the new project...",
    updatedAt: "2025-06-14T10:30:00Z",
    tags: ["work", "planning"],
  },
  {
    id: "2",
    title: "Meeting Notes",
    content: "Key takeaways from today's standup...",
    updatedAt: "2025-06-14T09:15:00Z",
    tags: ["meetings"],
  },
  {
    id: "3",
    title: "Ideas",
    content: "Random thoughts and inspiration...",
    updatedAt: "2025-06-13T16:45:00Z",
    tags: ["ideas", "creative"],
  },
];

interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  tags: string[];
}

export default function WorkspaceScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"pages" | "resources">("pages");

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

    if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      const diffDays = Math.ceil(diffHours / 24);
      return `${diffDays}d ago`;
    }
  };

  const renderNote = ({ item }: { item: Note }) => (
    <TouchableOpacity
      className="bg-background border border-border rounded-xl p-4 mb-3"
      activeOpacity={0.7}
    >
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-foreground text-lg font-semibold flex-1">
          {item.title}
        </Text>
        <Text className="text-muted-foreground text-sm ml-2">
          {formatDate(item.updatedAt)}
        </Text>
      </View>

      <Text className="text-muted-foreground text-sm mb-3" numberOfLines={2}>
        {item.content}
      </Text>

      {/* Tags */}
      <View className="flex-row flex-wrap">
        {item.tags.map((tag, index) => (
          <View
            key={index}
            className="bg-muted rounded-full px-2 py-1 mr-2 mb-1"
          >
            <Text className="text-muted-foreground text-xs">{tag}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-foreground text-2xl font-bold">
              Workspace
            </Text>
            <TouchableOpacity
              className="bg-primary rounded-full w-10 h-10 items-center justify-center"
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* Tab Switcher */}
          <View className="flex-row bg-muted rounded-xl p-1">
            <TouchableOpacity
              onPress={() => setActiveTab("pages")}
              className={`flex-1 py-2 px-4 rounded-lg ${
                activeTab === "pages" ? "bg-background" : ""
              }`}
              activeOpacity={0.8}
            >
              <Text
                className={`text-center font-medium ${
                  activeTab === "pages"
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Notes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("resources")}
              className={`flex-1 py-2 px-4 rounded-lg ${
                activeTab === "resources" ? "bg-background" : ""
              }`}
              activeOpacity={0.8}
            >
              <Text
                className={`text-center font-medium ${
                  activeTab === "resources"
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Resources
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View className="flex-1 px-6">
          {activeTab === "pages" ? (
            <View className="flex-1">
              {mockNotes.length > 0 ? (
                <FlatList
                  data={mockNotes}
                  renderItem={renderNote}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 20 }}
                />
              ) : (
                <View className="flex-1 justify-center items-center">
                  <Ionicons name="document-outline" size={64} color="#71717a" />
                  <Text className="text-muted-foreground text-lg mt-4 mb-2">
                    No notes yet
                  </Text>
                  <Text className="text-muted-foreground text-center text-sm">
                    Create your first note to get started
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View className="flex-1 justify-center items-center">
              <Ionicons name="link-outline" size={64} color="#71717a" />
              <Text className="text-muted-foreground text-lg mt-4 mb-2">
                No resources yet
              </Text>
              <Text className="text-muted-foreground text-center text-sm">
                Add links, articles, or other resources
              </Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
