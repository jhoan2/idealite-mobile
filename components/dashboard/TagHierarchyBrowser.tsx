// components/dashboard/TagHierarchyBrowser.tsx
import { FlashList } from "@shopify/flash-list";
import * as Haptics from "expo-haptics";
import { ChevronLeft, ChevronRight, Star } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import {
  useTagHierarchy,
  type TagHierarchyNode,
} from "../../hooks/dashboard/useTagHierarchy";

// Progress ring component with SVG
interface ProgressRingProps {
  progress: number;
  size?: number;
}

const ProgressRing: React.FC<ProgressRingProps> = ({ progress, size = 40 }) => {
  const radius = (size - 4) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Function to get emerald color based on progress percentage
  const getProgressColor = (progress: number): string => {
    if (progress <= 10) return "#A7F3D0"; // emerald-200
    if (progress <= 25) return "#6EE7B7"; // emerald-300
    if (progress <= 40) return "#34D399"; // emerald-400
    if (progress <= 55) return "#10B981"; // emerald-500
    if (progress <= 70) return "#059669"; // emerald-600
    if (progress <= 85) return "#047857"; // emerald-700
    if (progress <= 95) return "#065F46"; // emerald-800
    return "#064E3B"; // emerald-900
  };

  return (
    <View style={{ width: size, height: size, position: "relative" }}>
      <Svg
        width={size}
        height={size}
        style={{ transform: [{ rotate: "-90deg" }] }}
      >
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB" // gray-200
          strokeWidth="2"
          fill="transparent"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getProgressColor(progress)}
          strokeWidth="2"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>

      {/* Centered percentage text */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text className="text-xs font-medium text-gray-900">{progress}%</Text>
      </View>
    </View>
  );
};

// Breadcrumb type
type Breadcrumb = {
  id: string;
  name: string;
};

interface TagHierarchyBrowserProps {
  maxHeight?: number;
  onTagLongPress?: (tag: TagHierarchyNode) => void;
}

export function TagHierarchyBrowser({
  maxHeight = 400,
  onTagLongPress,
}: TagHierarchyBrowserProps) {
  const insets = useSafeAreaInsets();
  const { data: tagTree, isLoading, error, refetch } = useTagHierarchy();

  // Navigation state
  const [currentTagId, setCurrentTagId] = useState("root");
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);

  const currentTag = tagTree?.[currentTagId];
  const children: TagHierarchyNode[] = useMemo(() => {
    if (!currentTag?.children || !tagTree) return [];
    return currentTag.children
      .map((childId) => tagTree[childId])
      .filter((child): child is TagHierarchyNode => child !== undefined);
  }, [currentTag, tagTree]);

  // Determine which sections to show
  const showPinnedFirst = currentTagId === "root";
  const sections = useMemo(() => {
    if (!tagTree) return [];

    if (showPinnedFirst) {
      const sections = [];
      if (tagTree["pinned"]) {
        sections.push({
          tag: tagTree["pinned"],
          children:
            tagTree["pinned"].children
              ?.map((childId) => tagTree[childId])
              .filter(
                (child): child is TagHierarchyNode => child !== undefined
              ) || [],
          isPinned: true,
        });
      }
      if (tagTree["root"]) {
        sections.push({
          tag: tagTree["root"],
          children:
            tagTree["root"].children
              ?.map((childId) => tagTree[childId])
              .filter(
                (child): child is TagHierarchyNode => child !== undefined
              ) || [],
          isPinned: false,
        });
      }
      return sections;
    } else {
      return [
        {
          tag: currentTag!,
          children,
          isPinned: false,
        },
      ];
    }
  }, [tagTree, showPinnedFirst, currentTag, children]);

  const handleItemPress = useCallback(
    (tag: TagHierarchyNode) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (tag.children && tag.children.length > 0) {
        // Navigate to subtag
        if (currentTag) {
          setBreadcrumbs((prev) => [
            ...prev,
            { id: currentTagId, name: currentTag.name },
          ]);
          setCurrentTagId(tag.id);
        }
      }
      // If it's a leaf node, you could navigate to study page, etc.
    },
    [currentTag, currentTagId]
  );

  const handleItemLongPress = useCallback(
    (tag: TagHierarchyNode) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onTagLongPress?.(tag);
    },
    [onTagLongPress]
  );

  const handleBackPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (breadcrumbs.length > 0) {
      const lastBreadcrumb = breadcrumbs[breadcrumbs.length - 1]!;
      setBreadcrumbs((prev) => prev.slice(0, -1));
      setCurrentTagId(lastBreadcrumb.id);
    }
  }, [breadcrumbs]);

  const renderTagCard = useCallback(
    ({ tag, isPinned }: { tag: TagHierarchyNode; isPinned?: boolean }) => (
      <Pressable
        key={tag.id}
        onPress={() => handleItemPress(tag)}
        onLongPress={() => handleItemLongPress(tag)}
        delayLongPress={400}
        style={({ pressed }) => [
          {
            opacity: pressed ? 0.8 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
        className={`rounded-xl bg-white p-4 shadow-sm border border-gray-200 ${
          isPinned ? "border-l-4 border-l-yellow-400" : ""
        }`}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <View className="flex-row items-center gap-2 mb-1">
              <Text className="text-lg font-semibold text-gray-900 flex-1">
                {tag.name}
              </Text>
              {tag.isPinned && !isPinned && (
                <Star size={16} color="#F59E0B" fill="#F59E0B" />
              )}
            </View>

            {tag.description && (
              <Text className="text-sm text-gray-600 mb-2">
                {tag.description}
              </Text>
            )}

            {tag.children && tag.children.length > 0 ? (
              <Text className="text-xs text-gray-500">
                {tag.children.length} subtopic
                {tag.children.length !== 1 ? "s" : ""}
              </Text>
            ) : (
              <Text className="text-xs text-blue-600">
                {tag.cardCount} card{tag.cardCount !== 1 ? "s" : ""}
              </Text>
            )}
          </View>

          <View className="ml-4 flex-row items-center gap-3">
            <ProgressRing progress={tag.progress} />
            <View className="w-5 items-center justify-center">
              {tag.children && tag.children.length > 0 && (
                <ChevronRight size={20} color="#9CA3AF" />
              )}
            </View>
          </View>
        </View>
      </Pressable>
    ),
    [handleItemPress, handleItemLongPress]
  );

  const renderSection = useCallback(
    ({ item }: { item: (typeof sections)[0] }) => (
      <View className="mb-6">
        {/* Section Header */}
        <View className="mb-4 flex-row items-center gap-2 px-4">
          {item.isPinned && <Star size={20} color="#F59E0B" fill="#F59E0B" />}
          {item.tag.name === "Topics" && (
            <Text className="text-xl font-bold text-gray-900">
              {item.tag.name}
            </Text>
          )}
          {item.isPinned && (
            <View className="rounded-full bg-gray-100 px-2 py-1">
              <Text className="text-sm text-gray-600">Quick Access</Text>
            </View>
          )}
        </View>

        {/* Section Content */}
        <View className="gap-3 px-4">
          {item.children.length > 0 ? (
            item.children.map((child) =>
              renderTagCard({ tag: child, isPinned: item.isPinned })
            )
          ) : (
            <View className="rounded-xl bg-gray-50 p-8 items-center">
              <Text className="text-lg font-medium text-gray-500 mb-2">
                No subtopics
              </Text>
              <Text className="text-sm text-gray-400 text-center">
                This topic contains study materials and flashcards.
              </Text>
            </View>
          )}
        </View>
      </View>
    ),
    [renderTagCard]
  );

  if (isLoading) {
    return (
      <View
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        style={{ height: maxHeight }}
      >
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-600 mt-4">Loading topics...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        style={{ height: maxHeight }}
      >
        <View className="flex-1 justify-center items-center">
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            Failed to load topics
          </Text>
          <Text className="text-sm text-gray-600 mb-4 text-center">
            {error.message}
          </Text>
          <Pressable
            onPress={() => refetch()}
            style={({ pressed }) => [
              {
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              },
            ]}
            className="bg-blue-600 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-medium">Try Again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View
      className="bg-white rounded-xl shadow-sm border border-gray-200"
      style={{ height: maxHeight }}
    >
      {/* Header */}
      <View className="border-b border-gray-200">
        {/* Back navigation */}
        {breadcrumbs.length > 0 && (
          <View className="p-4 border-b border-gray-100">
            <Pressable
              onPress={handleBackPress}
              style={({ pressed }) => [
                {
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              className="flex-row items-center"
            >
              <ChevronLeft size={16} color="#6B7280" />
              <Text className="text-sm text-gray-600 ml-1">
                Back to {breadcrumbs[breadcrumbs.length - 1]?.name}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Title */}
        {!showPinnedFirst && (
          <View className="p-4">
            <Text className="text-2xl font-bold text-gray-900">
              {currentTag?.name}
            </Text>
            {breadcrumbs.length > 0 && (
              <Text className="text-sm text-gray-500 mt-1">
                {breadcrumbs.map((crumb) => crumb.name).join(" > ")} &gt;{" "}
                {currentTag?.name}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Content */}
      <FlashList
        data={sections}
        renderItem={renderSection}
        keyExtractor={(item) => item.tag.id}
        estimatedItemSize={200}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 16 }}
      />
    </View>
  );
}
