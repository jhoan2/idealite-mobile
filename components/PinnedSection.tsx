// components/PinnedSection.tsx
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface PinnedItem {
  id: string;
  title: string;
  route: string;
}

interface PinnedSectionProps {
  onItemPress?: () => void; // Callback to close sidebar when item is pressed
}

export function PinnedSection({ onItemPress }: PinnedSectionProps) {
  const router = useRouter();

  const pinnedItems: PinnedItem[] = [
    {
      id: "react-docs",
      title: "React Documentation",
      route: "/(tabs)/pinned/react-docs",
    },
    {
      id: "project-dashboard",
      title: "Project Dashboard",
      route: "/(tabs)/pinned/project-dashboard",
    },
    {
      id: "team-notes",
      title: "Team Notes",
      route: "/(tabs)/pinned/team-notes",
    },
  ];

  const handleItemPress = (route: string) => {
    onItemPress?.(); // Close sidebar if callback provided
    router.push(route as any);
  };

  return (
    <View className="py-2">
      {/* Pinned Section Header */}
      <View className="px-6 py-2">
        <Text className="text-muted-foreground text-xs font-medium tracking-wider">
          Pinned
        </Text>
      </View>

      {/* Pinned Items */}
      {pinnedItems.map((item) => {
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => handleItemPress(item.route)}
            className="flex-row items-center px-6 py-3 active:bg-gray-100"
            activeOpacity={0.7}
          >
            <Text className="text-sm font-medium">{item.title}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
