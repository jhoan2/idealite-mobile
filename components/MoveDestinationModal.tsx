// components/MoveDestinationModal.tsx
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMovePage } from "../hooks/useMovePage";
import { TreeFolder, TreeTag } from "../lib/api/tagTree";

interface MoveOption {
  id: string; // "tag-uuid" or "folder-uuid"
  label: string; // Full hierarchical path
  type: "tag" | "folder";
  icon: string;
}

interface MoveDestinationModalProps {
  visible: boolean;
  onClose: () => void;
  pageId: string;
  pageTitle: string;
  tagTree: TreeTag[];
  currentTagId?: string | null;
  currentFolderId?: string | null;
}

export function MoveDestinationModal({
  visible,
  onClose,
  pageId,
  pageTitle,
  tagTree,
  currentTagId,
  currentFolderId,
}: MoveDestinationModalProps) {
  const { bottom } = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheet>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDestination, setSelectedDestination] = useState<string | null>(
    null
  );

  const movePageMutation = useMovePage();

  const snapPoints = useMemo(() => ["90%"], []);

  // Generate move options from tag tree
  const moveOptions = useMemo(() => {
    const options: MoveOption[] = [];

    const generateOptions = (
      tags: TreeTag[],
      parentPath = ""
    ): MoveOption[] => {
      const results: MoveOption[] = [];

      tags.forEach((tag) => {
        const currentPath = parentPath
          ? `${parentPath} / ${tag.name}`
          : tag.name;

        // Add tag as option (exclude current tag)
        if (tag.id !== currentTagId) {
          results.push({
            id: `tag-${tag.id}`,
            label: currentPath,
            type: "tag",
            icon: "pricetags-outline",
          });
        }

        // Add folders from this tag
        if (tag.folders) {
          const folderOptions = generateFolderOptions(tag.folders, currentPath);
          results.push(...folderOptions);
        }

        // Process child tags
        if (tag.children && tag.children.length > 0) {
          const childOptions = generateOptions(tag.children, currentPath);
          results.push(...childOptions);
        }
      });

      return results;
    };

    const generateFolderOptions = (
      folders: TreeFolder[],
      tagPath: string
    ): MoveOption[] => {
      const results: MoveOption[] = [];

      folders.forEach((folder) => {
        const folderPath = `${tagPath} / ${folder.name}`;

        // Add folder as option (exclude current folder)
        if (folder.id !== currentFolderId) {
          results.push({
            id: `folder-${folder.id}`,
            label: folderPath,
            type: "folder",
            icon: "folder-outline",
          });
        }

        // Process subfolders recursively
        if (folder.subFolders && folder.subFolders.length > 0) {
          const subFolderOptions = generateFolderOptions(
            folder.subFolders,
            folderPath
          );
          results.push(...subFolderOptions);
        }
      });

      return results;
    };

    return generateOptions(tagTree);
  }, [tagTree, currentTagId, currentFolderId]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) {
      return moveOptions;
    }

    return moveOptions.filter((option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [moveOptions, searchQuery]);

  const handleMove = async () => {
    if (!selectedDestination) {
      Alert.alert("Error", "Please select a destination");
      return;
    }

    try {
      await movePageMutation.mutateAsync({
        pageId,
        destinationId: selectedDestination,
      });

      Alert.alert("Success", `"${pageTitle}" moved successfully`);
      onClose();
    } catch (error) {
      console.error("Error moving page:", error);
      Alert.alert("Error", "Failed to move page. Please try again.");
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    setSelectedDestination(null);
    onClose();
  };

  // Open sheet when visible changes
  React.useEffect(() => {
    if (visible) {
      // Small delay to ensure the action sheet is closed first
      setTimeout(() => {
        sheetRef.current?.snapToIndex(0);
      }, 100);
    } else {
      sheetRef.current?.close();
    }
  }, [visible]);

  const renderMoveOption = ({ item }: { item: MoveOption }) => {
    const isSelected = selectedDestination === item.id;

    return (
      <TouchableOpacity
        className="flex-row items-center p-4 border-b border-border bg-background"
        style={{
          backgroundColor: isSelected ? "#F3F4F6" : "white",
        }}
        onPress={() => {
          setSelectedDestination(isSelected ? null : item.id);
        }}
        activeOpacity={0.7}
      >
        <Ionicons
          name={item.icon as any}
          size={20}
          color={item.type === "folder" ? "#6B7280" : "#4B5563"}
          style={{ marginRight: 12 }}
        />
        <Text
          className="flex-1 text-base text-foreground"
          style={{
            fontWeight: isSelected ? "600" : "400",
          }}
          numberOfLines={2}
        >
          {item.label}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
        )}
      </TouchableOpacity>
    );
  };

  const renderFooter = () => (
    <View className="p-4 bg-background" style={{ paddingBottom: bottom + 16 }}>
      <View className="flex-row gap-3">
        <TouchableOpacity
          className="flex-1 p-4 rounded-lg border border-border bg-background items-center"
          onPress={handleClose}
          activeOpacity={0.8}
        >
          <Text className="text-base text-foreground font-semibold">
            Cancel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 p-4 rounded-lg items-center"
          style={{
            backgroundColor: selectedDestination ? "#4B5563" : "#D1D5DB",
            opacity: movePageMutation.isPending ? 0.5 : 1,
          }}
          onPress={handleMove}
          disabled={!selectedDestination || movePageMutation.isPending}
          activeOpacity={0.8}
        >
          {movePageMutation.isPending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text
              className="text-base font-semibold"
              style={{
                color: selectedDestination ? "white" : "#9CA3AF",
              }}
            >
              Move
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View className="p-8 items-center">
      <Ionicons name="search-outline" size={48} color="#D1D5DB" />
      <Text className="mt-4 text-base text-muted-foreground text-center">
        {searchQuery.trim()
          ? "No destinations found"
          : "No destinations available"}
      </Text>
    </View>
  );

  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={handleClose}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
        />
      )}
      backgroundStyle={{
        backgroundColor: "#FFFFFF",
      }}
      handleIndicatorStyle={{
        backgroundColor: "#D1D5DB",
        width: 40,
      }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-foreground">
            Move "{pageTitle}"
          </Text>
          <Text className="text-sm text-muted-foreground mt-1">
            Select a destination
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleClose}
          className="p-2"
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View className="px-4 pb-4">
        <BottomSheetTextInput
          className="border border-border rounded-lg p-3 text-base bg-muted"
          placeholder="Search destinations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#6B7280"
        />
      </View>

      {/* Destinations List */}
      <BottomSheetFlatList
        data={filteredOptions}
        keyExtractor={(item) => item.id}
        renderItem={renderMoveOption}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{
          backgroundColor: "white",
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={true}
      />
    </BottomSheet>
  );
}
