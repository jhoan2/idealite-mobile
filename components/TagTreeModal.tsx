// components/TagTreeModal.tsx
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import * as Sentry from "@sentry/react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useArchiveTag } from "../hooks/useArchiveTag";
import { useCreateFolder } from "../hooks/useCreateFolder";
import { useCreatePage } from "../hooks/useCreatePage";
import { useCreateTag } from "../hooks/useCreateTag";
import { useDeleteFolder } from "../hooks/useDeleteFolder";
import { useDeletePage } from "../hooks/useDeletePage";
import { useTagTree } from "../hooks/useTagTree";
import { TreeFolder, TreePage, TreeTag } from "../lib/api/tagTree";
import { MoveDestinationModal } from "./MoveDestinationModal";

interface TagTreeModalProps {
  visible: boolean;
  onClose: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MODAL_WIDTH = SCREEN_WIDTH * 0.85;
const INDENT_SIZE = 16;

export function TagTreeModal({ visible, onClose }: TagTreeModalProps) {
  const { top, bottom } = useSafeAreaInsets();

  // Use the React Query hook
  const {
    tagTree,
    isLoading,
    error,
    refetch,
    toggleTag,
    toggleFolder,
    isTagExpanded,
    isFolderExpanded,
    hasPendingUpdates,
    forceSyncPendingUpdates,
  } = useTagTree();

  // Archive mutation
  const archiveTagMutation = useArchiveTag();

  // Add the create page mutation
  const createPageMutation = useCreatePage();

  // Add folder creation state
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [folderName, setFolderName] = useState("");

  // Add the create folder mutation
  const createFolderMutation = useCreateFolder();

  // Add the delete folder mutation
  const deleteFolderMutation = useDeleteFolder();

  // Add tag creation state
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagName, setTagName] = useState("");

  // Add the create tag mutation
  const createTagMutation = useCreateTag();

  // Add the delete page mutation
  const deletePageMutation = useDeletePage();

  // Animation refs
  const slideAnim = useRef(new Animated.Value(-MODAL_WIDTH)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // BottomSheet setup
  const sheetRef = useRef<BottomSheet>(null);
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    title: string;
    type: "tag" | "folder" | "page";
  } | null>(null);

  const snapPoints = useMemo(() => ["25%", "50%", "75%"], []);

  const generateUntitledName = (existingPages: TreePage[]) => {
    const untitledPages = existingPages.filter((page) =>
      page.title?.toLowerCase().startsWith("untitled")
    );

    return untitledPages.length === 0
      ? "untitled"
      : `untitled ${untitledPages.length}`;
  };

  const buildTagHierarchy = (tagId: string, tagTree: TreeTag[]): string[] => {
    const findTagPath = (
      tags: TreeTag[],
      targetId: string,
      currentPath: string[] = []
    ): string[] | null => {
      for (const tag of tags) {
        const newPath = [...currentPath, tag.id];

        if (tag.id === targetId) {
          return newPath;
        }

        if (tag.children && tag.children.length > 0) {
          const result = findTagPath(tag.children, targetId, newPath);
          if (result) return result;
        }
      }
      return null;
    };

    return findTagPath(tagTree, tagId) || [tagId];
  };

  // Add state for move destination modal
  const [showMoveModal, setShowMoveModal] = useState(false);

  const actions = useMemo(() => {
    const baseActions = [];

    // Show create actions based on item type
    if (selectedItem?.type === "tag") {
      if (!showFolderInput && !showTagInput) {
        baseActions.push(
          {
            key: "create-tag",
            label: "Create Tag",
            icon: "pricetags-outline",
          },
          {
            key: "create-page",
            label: "Create Page",
            icon: "document-text-outline",
          },
          {
            key: "create-canvas",
            label: "Create Canvas",
            icon: "color-palette-outline",
          },
          {
            key: "create-folder",
            label: "Create Folder",
            icon: "folder-outline",
          }
        );
      }
    } else if (selectedItem?.type === "folder") {
      if (!showFolderInput && !showTagInput) {
        baseActions.push(
          {
            key: "create-page",
            label: "Create Page",
            icon: "document-text-outline",
          },
          {
            key: "create-canvas",
            label: "Create Canvas",
            icon: "color-palette-outline",
          },
          {
            key: "create-folder",
            label: "Create Folder",
            icon: "folder-outline",
          }
        );
      }
    } else if (selectedItem?.type === "page") {
      // Add move action for pages
      if (!showFolderInput && !showTagInput) {
        baseActions.push({
          key: "move-to",
          label: "Move to",
          icon: "move-outline",
        });
      }
    }

    // Add remaining actions based on type
    if (!showFolderInput && !showTagInput) {
      // Archive is only for tags
      if (selectedItem?.type === "tag") {
        baseActions.push({
          key: "archive",
          label: "Archive",
          icon: "archive-outline",
        });
      }

      // Delete is available for all types
      baseActions.push({
        key: "delete",
        label: "Delete",
        icon: "trash-outline",
      });
    }

    return baseActions;
  }, [selectedItem?.type, showFolderInput, showTagInput]);

  const openSheet = (item: {
    id: string;
    title: string;
    type: "tag" | "folder" | "page";
  }) => {
    setSelectedItem(item);
    sheetRef.current?.snapToIndex(2);
  };

  // Add the create page handler
  const handleCreatePage = async (type: "page" | "canvas") => {
    if (!selectedItem) return;

    try {
      let tagId: string;
      let folderId: string | null = null;
      let existingPages: TreePage[] = [];

      if (selectedItem.type === "tag") {
        tagId = selectedItem.id;
        // Find the tag in the tree to get its pages
        const findTag = (tags: TreeTag[]): TreeTag | null => {
          for (const tag of tags) {
            if (tag.id === selectedItem.id) return tag;
            if (tag.children) {
              const found = findTag(tag.children);
              if (found) return found;
            }
          }
          return null;
        };

        const tag = findTag(tagTree);
        existingPages = tag?.pages || [];
      } else if (selectedItem.type === "folder") {
        // Find the folder and its parent tag
        const findFolder = (
          tags: TreeTag[]
        ): { folder: TreeFolder; tagId: string } | null => {
          for (const tag of tags) {
            if (tag.folders) {
              const findInFolders = (
                folders: TreeFolder[]
              ): TreeFolder | null => {
                for (const folder of folders) {
                  if (folder.id === selectedItem.id) return folder;
                  if (folder.subFolders) {
                    const found = findInFolders(folder.subFolders);
                    if (found) return found;
                  }
                }
                return null;
              };

              const folder = findInFolders(tag.folders);
              if (folder) return { folder, tagId: tag.id };
            }

            if (tag.children) {
              const found = findFolder(tag.children);
              if (found) return found;
            }
          }
          return null;
        };

        const result = findFolder(tagTree);
        if (!result) throw new Error("Folder not found");

        tagId = result.tagId;
        folderId = selectedItem.id;
        existingPages = result.folder.pages || [];
      } else {
        throw new Error("Cannot create page in this context");
      }

      const title = generateUntitledName(existingPages);
      const hierarchy = buildTagHierarchy(tagId, tagTree);

      await createPageMutation.mutateAsync({
        title,
        tagId,
        hierarchy,
        folderId,
        type,
      });

      Alert.alert(
        "Success",
        `${type === "canvas" ? "Canvas" : "Page"} created successfully`
      );
      sheetRef.current?.close();
    } catch (error) {
      console.error("Error creating page:", error);
      Alert.alert("Error", `Failed to create ${type}. Please try again.`);
    }
  };

  // Add folder creation handler
  const handleCreateFolder = async () => {
    if (!selectedItem) return;

    try {
      let tagId: string;
      let parentFolderId: string | undefined;

      if (selectedItem.type === "tag") {
        tagId = selectedItem.id;
        parentFolderId = undefined;
      } else if (selectedItem.type === "folder") {
        // Find the folder's parent tag
        const findFolder = (tags: TreeTag[]): { tagId: string } | null => {
          for (const tag of tags) {
            if (tag.folders) {
              const findInFolders = (folders: TreeFolder[]): boolean => {
                for (const folder of folders) {
                  if (folder.id === selectedItem.id) return true;
                  if (folder.subFolders && findInFolders(folder.subFolders))
                    return true;
                }
                return false;
              };

              if (findInFolders(tag.folders)) {
                return { tagId: tag.id };
              }
            }

            if (tag.children) {
              const found = findFolder(tag.children);
              if (found) return found;
            }
          }
          return null;
        };

        const result = findFolder(tagTree);
        if (!result) throw new Error("Parent tag not found");

        tagId = result.tagId;
        parentFolderId = selectedItem.id;
      } else {
        throw new Error("Cannot create folder in this context");
      }

      await createFolderMutation.mutateAsync({
        name: folderName.trim() || undefined, // Send undefined for auto-generation
        tagId,
        parentFolderId,
      });

      Alert.alert("Success", "Folder created successfully");
      setShowFolderInput(false);
      setFolderName("");
      sheetRef.current?.close();
    } catch (error) {
      console.error("Error creating folder:", error);
      Alert.alert("Error", "Failed to create folder. Please try again.");
    }
  };

  // Add the create tag handler
  const handleCreateTag = async () => {
    if (!selectedItem || selectedItem.type !== "tag") return;

    try {
      if (!tagName.trim()) {
        Alert.alert("Error", "Tag name cannot be empty");
        return;
      }

      await createTagMutation.mutateAsync({
        name: tagName.trim(),
        parentId: selectedItem.id,
      });

      Alert.alert("Success", "Tag created successfully");
      setShowTagInput(false);
      setTagName("");
      sheetRef.current?.close();
    } catch (error) {
      console.error("Error creating tag:", error);
      Alert.alert("Error", "Failed to create tag. Please try again.");
    }
  };

  const handleActionPress = async (actionKey: string) => {
    if (!selectedItem) return;

    try {
      switch (actionKey) {
        case "create-tag":
          setShowTagInput(true);
          break;

        case "create-page":
        case "create-canvas":
          await handleCreatePage(
            actionKey === "create-canvas" ? "canvas" : "page"
          );
          break;

        case "create-folder":
          setShowFolderInput(true);
          break;

        case "move-to":
          if (selectedItem.type === "page") {
            // Close the action sheet and open move modal
            sheetRef.current?.close();
            setShowMoveModal(true);
          }
          break;

        case "archive":
          if (selectedItem.type === "tag") {
            Alert.alert(
              "Archive Tag",
              `Are you sure you want to archive "${selectedItem.title}"?`,
              [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Archive",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      await archiveTagMutation.mutateAsync({
                        tagId: selectedItem.id,
                        isArchived: true,
                      });

                      Alert.alert("Success", "Tag archived successfully");
                      sheetRef.current?.close();
                    } catch (error) {
                      Alert.alert(
                        "Error",
                        "Failed to archive tag. Please try again."
                      );
                    }
                  },
                },
              ]
            );
          }
          break;

        case "delete":
          if (selectedItem.type === "folder") {
            Alert.alert(
              "Delete Folder",
              `Are you sure you want to delete "${selectedItem.title}"? This will also delete all pages inside this folder.`,
              [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      await deleteFolderMutation.mutateAsync({
                        id: selectedItem.id,
                      });

                      Alert.alert("Success", "Folder deleted successfully");
                      sheetRef.current?.close();
                    } catch (error) {
                      console.error("Error deleting folder:", error);
                      Alert.alert(
                        "Error",
                        "Failed to delete folder. Please try again."
                      );
                    }
                  },
                },
              ]
            );
          } else if (selectedItem.type === "page") {
            Alert.alert(
              "Delete Page",
              `Are you sure you want to delete "${selectedItem.title}"?`,
              [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      await deletePageMutation.mutateAsync({
                        id: selectedItem.id,
                        title: selectedItem.title, // Include title for tab deletion
                      });

                      Alert.alert("Success", "Page deleted successfully");
                      sheetRef.current?.close();
                    } catch (error) {
                      console.error("Error deleting page:", error);
                      Alert.alert(
                        "Error",
                        "Failed to delete page. Please try again."
                      );
                    }
                  },
                },
              ]
            );
          } else {
            // Generic delete for tags (still TODO)
            Alert.alert(
              "Delete Tag",
              `Are you sure you want to delete "${selectedItem.title}"?`,
              [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => {
                    console.log(
                      `Delete ${selectedItem.type} ${selectedItem.id}`
                    );
                    sheetRef.current?.close();
                    // TODO: Implement delete tag functionality
                  },
                },
              ]
            );
          }
          break;

        default:
          console.log(`Unknown action: ${actionKey}`);
          sheetRef.current?.close();
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          component: "TagTreeModal",
          action: "handle_action_press",
        },
        extra: {
          actionKey,
          selectedItem,
        },
      });

      Alert.alert("Error", "Something went wrong. Please try again.");
      sheetRef.current?.close();
    }
  };

  // Handle modal animations
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Force sync pending updates when modal closes
      if (hasPendingUpdates) {
        forceSyncPendingUpdates();
      }

      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -MODAL_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [
    visible,
    slideAnim,
    opacityAnim,
    hasPendingUpdates,
    forceSyncPendingUpdates,
  ]);

  // Reset folder input when modal closes or item changes
  useEffect(() => {
    if (!visible) {
      setShowFolderInput(false);
      setFolderName("");
      setShowTagInput(false);
      setTagName("");
    }
  }, [visible]);

  useEffect(() => {
    setShowFolderInput(false);
    setFolderName("");
    setShowTagInput(false);
    setTagName("");
  }, [selectedItem]);

  const handlePagePress = (pageId: string, title: string) => {
    try {
      // TODO: Navigate to page
      console.log(`Navigate to page: ${pageId} - ${title}`);
      onClose();
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          component: "TagTreeModal",
          action: "page_press",
        },
      });
    }
  };

  // Recursive folder renderer
  const renderFolder = (folder: TreeFolder, level: number) => {
    const isExpanded = isFolderExpanded(folder.id);
    const indentStyle = { paddingLeft: level * INDENT_SIZE };

    return (
      <View key={folder.id} style={{ marginBottom: 4 }}>
        {/* Folder Header */}
        <TouchableOpacity
          style={[
            {
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 4,
            },
            indentStyle,
          ]}
          onPress={() => toggleFolder(folder.id)}
          onLongPress={() =>
            openSheet({ id: folder.id, title: folder.name, type: "folder" })
          }
          activeOpacity={0.7}
        >
          <Ionicons
            name={isExpanded ? "chevron-down" : "chevron-forward"}
            size={16}
            color="#6B7280"
          />
          <Ionicons
            name="folder"
            size={16}
            color="#6B7280"
            style={{ marginLeft: 4 }}
          />
          <Text
            style={{
              marginLeft: 8,
              fontSize: 14,
              fontWeight: "500",
              color: "#374151",
            }}
          >
            {folder.name}
          </Text>
        </TouchableOpacity>

        {/* Folder Contents */}
        {isExpanded && (
          <View>
            {/* Folder Pages */}
            {folder.pages?.map((page: TreePage) => (
              <TouchableOpacity
                key={page.id}
                style={[
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 4,
                    paddingLeft: (level + 1) * INDENT_SIZE + 16,
                  },
                ]}
                onPress={() => handlePagePress(page.id, page.title || "")}
                onLongPress={() =>
                  openSheet({
                    id: page.id,
                    title: page.title || "",
                    type: "page",
                  })
                }
                activeOpacity={0.7}
              >
                <Ionicons
                  name={
                    page.content_type === "canvas"
                      ? "color-palette-outline"
                      : "document-text-outline"
                  }
                  size={14}
                  color="#6B7280"
                />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 13,
                    color: "#4B5563",
                  }}
                  numberOfLines={1}
                >
                  {page.title}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Subfolder Recursion */}
            {folder.subFolders?.map((subfolder: TreeFolder) =>
              renderFolder(subfolder, level + 1)
            )}
          </View>
        )}
      </View>
    );
  };

  // Recursive tag renderer
  const renderTag = (tag: TreeTag, level = 0) => {
    const isExpanded = isTagExpanded(tag.id);
    const indentStyle = { paddingLeft: level * INDENT_SIZE };

    return (
      <View key={tag.id} style={{ marginBottom: 8 }}>
        {/* Tag Header */}
        <TouchableOpacity
          style={[
            {
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 4,
            },
            indentStyle,
          ]}
          onPress={() => toggleTag(tag.id)}
          onLongPress={() =>
            openSheet({ id: tag.id, title: tag.name, type: "tag" })
          }
          activeOpacity={0.7}
        >
          <Ionicons
            name={isExpanded ? "chevron-down" : "chevron-forward"}
            size={18}
            color="#4B5563"
          />
          <Ionicons
            name="pricetags"
            size={16}
            color="#4B5563"
            style={{ marginLeft: 6 }}
          />
          <Text
            style={{
              marginLeft: 8,
              fontSize: 15,
              fontWeight: "600",
              color: "#1F2937",
            }}
          >
            {tag.name}
          </Text>
        </TouchableOpacity>

        {/* Tag Contents */}
        {isExpanded && (
          <View style={{ marginTop: 4 }}>
            {/* Direct Pages (not in folders) */}
            {tag.pages?.map((page: TreePage) => (
              <TouchableOpacity
                key={page.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 4,
                  paddingLeft: (level + 1) * INDENT_SIZE,
                }}
                onPress={() => handlePagePress(page.id, page.title || "")}
                onLongPress={() =>
                  openSheet({
                    id: page.id,
                    title: page.title || "",
                    type: "page",
                  })
                }
                activeOpacity={0.7}
              >
                <Ionicons
                  name={
                    page.content_type === "canvas"
                      ? "color-palette-outline"
                      : "document-text-outline"
                  }
                  size={14}
                  color="#6B7280"
                />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 13,
                    color: "#4B5563",
                  }}
                  numberOfLines={1}
                >
                  {page.title}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Folders */}
            {tag.folders?.map((folder: TreeFolder) =>
              renderFolder(folder, level + 1)
            )}

            {/* Child Tags */}
            {tag.children?.map((child: TreeTag) => renderTag(child, level + 1))}
          </View>
        )}
      </View>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 32,
          }}
        >
          <ActivityIndicator size="large" color="#4B5563" />
          <Text
            style={{
              marginTop: 16,
              fontSize: 16,
              color: "#6B7280",
              textAlign: "center",
            }}
          >
            Loading your tags...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 32,
          }}
        >
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text
            style={{
              marginTop: 16,
              fontSize: 16,
              color: "#EF4444",
              textAlign: "center",
              fontWeight: "600",
            }}
          >
            Failed to load tags
          </Text>
          <Text
            style={{
              marginTop: 8,
              fontSize: 14,
              color: "#6B7280",
              textAlign: "center",
            }}
          >
            {error.message}
          </Text>
          <TouchableOpacity
            style={{
              marginTop: 16,
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: "#4B5563",
              borderRadius: 8,
            }}
            onPress={() => refetch()}
          >
            <Text style={{ color: "white", fontWeight: "500" }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (tagTree.length === 0) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 32,
          }}
        >
          <Ionicons name="folder-outline" size={48} color="#6B7280" />
          <Text
            style={{
              marginTop: 16,
              fontSize: 16,
              color: "#6B7280",
              textAlign: "center",
            }}
          >
            No tags found
          </Text>
          <Text
            style={{
              marginTop: 8,
              fontSize: 14,
              color: "#9CA3AF",
              textAlign: "center",
            }}
          >
            Create your first tag to get started
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor="#4B5563"
          />
        }
      >
        {tagTree.map((tag) => renderTag(tag))}
      </ScrollView>
    );
  };

  // Find the current tag/folder for the selected page
  const getCurrentLocation = () => {
    if (!selectedItem || selectedItem.type !== "page") {
      return { currentTagId: null, currentFolderId: null };
    }

    // Find the page in the tag tree to get its current location
    const findPageLocation = (
      tags: TreeTag[]
    ): { currentTagId: string | null; currentFolderId: string | null } => {
      for (const tag of tags) {
        // Check direct pages
        if (tag.pages?.some((page) => page.id === selectedItem.id)) {
          const page = tag.pages.find((p) => p.id === selectedItem.id);
          return {
            currentTagId: page?.primary_tag_id || tag.id,
            currentFolderId: page?.folder_id || null,
          };
        }

        // Check folders
        if (tag.folders) {
          const checkFolders = (folders: TreeFolder[]): any => {
            for (const folder of folders) {
              if (folder.pages?.some((page) => page.id === selectedItem.id)) {
                const page = folder.pages.find((p) => p.id === selectedItem.id);
                return {
                  currentTagId: page?.primary_tag_id || tag.id,
                  currentFolderId: folder.id,
                };
              }
              if (folder.subFolders) {
                const result = checkFolders(folder.subFolders);
                if (result) return result;
              }
            }
            return null;
          };

          const result = checkFolders(tag.folders);
          if (result) return result;
        }

        // Check child tags
        if (tag.children) {
          const result = findPageLocation(tag.children);
          if (result.currentTagId || result.currentFolderId) {
            return result;
          }
        }
      }

      return { currentTagId: null, currentFolderId: null };
    };

    return findPageLocation(tagTree);
  };

  return (
    <>
      {/* Drawer */}
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: MODAL_WIDTH,
          backgroundColor: "#FFFFFF",
          borderRightWidth: 1,
          borderColor: "#D1D5DB",
          paddingTop: top,
          paddingBottom: bottom,
          transform: [{ translateX: slideAnim }],
          shadowColor: "#000",
          shadowOffset: {
            width: 2,
            height: 0,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottomWidth: 1,
            borderColor: "#D1D5DB",
            paddingHorizontal: 16,
            paddingVertical: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: "#111827" }}>
              Workspace
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={{ padding: 8 }}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {renderContent()}
      </Animated.View>

      {/* Action Bottom Sheet */}
      <BottomSheet
        ref={sheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose
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
        <View style={{ padding: 16, paddingBottom: 8 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: "#111827",
              marginBottom: 4,
            }}
          >
            {selectedItem?.title}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#6B7280",
              marginBottom: 16,
              textTransform: "capitalize",
            }}
          >
            {selectedItem?.type}
          </Text>
        </View>

        {showFolderInput ? (
          // Folder creation input
          <View style={{ padding: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 12 }}>
              Create New Folder
            </Text>
            <BottomSheetTextInput
              style={{
                borderWidth: 1,
                borderColor: "#D1D5DB",
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                marginBottom: 16,
                backgroundColor: "white",
              }}
              placeholder="Enter folder name (optional)"
              value={folderName}
              onChangeText={setFolderName}
              autoFocus
              onSubmitEditing={handleCreateFolder}
              returnKeyType="done"
            />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#D1D5DB",
                  alignItems: "center",
                }}
                onPress={() => {
                  setShowFolderInput(false);
                  setFolderName("");
                }}
              >
                <Text style={{ fontSize: 16, color: "#374151" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: "#4B5563",
                  alignItems: "center",
                  opacity: createFolderMutation.isPending ? 0.5 : 1,
                }}
                onPress={handleCreateFolder}
                disabled={createFolderMutation.isPending}
              >
                {createFolderMutation.isPending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text
                    style={{ fontSize: 16, color: "white", fontWeight: "600" }}
                  >
                    Create
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : showTagInput ? (
          // Tag creation input
          <View style={{ padding: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 12 }}>
              Create New Tag
            </Text>
            <BottomSheetTextInput
              style={{
                borderWidth: 1,
                borderColor: "#D1D5DB",
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                marginBottom: 16,
                backgroundColor: "white",
              }}
              placeholder="Enter tag name"
              value={tagName}
              onChangeText={setTagName}
              autoFocus
              onSubmitEditing={handleCreateTag}
              returnKeyType="done"
            />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#D1D5DB",
                  alignItems: "center",
                }}
                onPress={() => {
                  setShowTagInput(false);
                  setTagName("");
                }}
              >
                <Text style={{ fontSize: 16, color: "#374151" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: "#4B5563",
                  alignItems: "center",
                  opacity: createTagMutation.isPending ? 0.5 : 1,
                }}
                onPress={handleCreateTag}
                disabled={createTagMutation.isPending}
              >
                {createTagMutation.isPending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text
                    style={{ fontSize: 16, color: "white", fontWeight: "600" }}
                  >
                    Create
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Regular actions list
          <BottomSheetFlatList
            data={actions}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  borderBottomWidth: 1,
                  borderColor: "#E5E7EB",
                  opacity:
                    (archiveTagMutation.isPending && item.key === "archive") ||
                    (createPageMutation.isPending &&
                      (item.key === "create-page" ||
                        item.key === "create-canvas")) ||
                    (createFolderMutation.isPending &&
                      item.key === "create-folder") ||
                    (createTagMutation.isPending &&
                      item.key === "create-tag") ||
                    (deleteFolderMutation.isPending &&
                      item.key === "delete" &&
                      selectedItem?.type === "folder") ||
                    (deletePageMutation.isPending &&
                      item.key === "delete" &&
                      selectedItem?.type === "page")
                      ? 0.5
                      : 1,
                }}
                onPress={() => handleActionPress(item.key)}
                disabled={
                  (archiveTagMutation.isPending && item.key === "archive") ||
                  (createPageMutation.isPending &&
                    (item.key === "create-page" ||
                      item.key === "create-canvas")) ||
                  (createFolderMutation.isPending &&
                    item.key === "create-folder") ||
                  (createTagMutation.isPending && item.key === "create-tag") ||
                  (deleteFolderMutation.isPending &&
                    item.key === "delete" &&
                    selectedItem?.type === "folder") ||
                  (deletePageMutation.isPending &&
                    item.key === "delete" &&
                    selectedItem?.type === "page")
                }
              >
                {(archiveTagMutation.isPending && item.key === "archive") ||
                (createPageMutation.isPending &&
                  (item.key === "create-page" ||
                    item.key === "create-canvas")) ||
                (createFolderMutation.isPending &&
                  item.key === "create-folder") ||
                (createTagMutation.isPending && item.key === "create-tag") ||
                (deleteFolderMutation.isPending &&
                  item.key === "delete" &&
                  selectedItem?.type === "folder") ||
                (deletePageMutation.isPending &&
                  item.key === "delete" &&
                  selectedItem?.type === "page") ? (
                  <ActivityIndicator
                    size="small"
                    color="#4B5563"
                    style={{ marginRight: 12 }}
                  />
                ) : (
                  <Ionicons
                    name={item.icon as any}
                    size={20}
                    color={item.key === "delete" ? "#EF4444" : "#374151"}
                    style={{ marginRight: 12 }}
                  />
                )}
                <Text
                  style={{
                    fontSize: 16,
                    color: item.key === "delete" ? "#EF4444" : "#374151",
                  }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ backgroundColor: "white" }}
          />
        )}
      </BottomSheet>

      {/* Move Destination Modal - Only render when showMoveModal is true */}
      {showMoveModal && selectedItem?.type === "page" && (
        <MoveDestinationModal
          visible={showMoveModal}
          onClose={() => {
            setShowMoveModal(false);
            // Don't clear selectedItem here - let the action sheet handle it
          }}
          pageId={selectedItem.id}
          pageTitle={selectedItem.title}
          tagTree={tagTree}
          currentTagId={getCurrentLocation().currentTagId}
          currentFolderId={getCurrentLocation().currentFolderId}
        />
      )}
    </>
  );
}
