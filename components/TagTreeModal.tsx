// components/TagTreeModal.tsx
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import * as Sentry from "@sentry/react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useArchiveTag } from "../hooks/useArchiveTag";
import { useTagTree } from "../hooks/useTagTree";
import { TreeFolder, TreePage, TreeTag } from "../lib/api/tagTree";

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

  const actions = useMemo(() => {
    const baseActions = [
      { key: "edit", label: "Edit", icon: "create-outline" },
      { key: "share", label: "Share", icon: "share-outline" },
    ];

    // Only show archive for tags (you can extend this logic for other types)
    if (selectedItem?.type === "tag") {
      baseActions.splice(1, 0, {
        key: "archive",
        label: "Archive",
        icon: "archive-outline",
      });
    }

    baseActions.push({
      key: "delete",
      label: "Delete",
      icon: "trash-outline",
    });

    return baseActions;
  }, [selectedItem?.type]);

  const openSheet = (item: {
    id: string;
    title: string;
    type: "tag" | "folder" | "page";
  }) => {
    setSelectedItem(item);
    sheetRef.current?.snapToIndex(2);
  };

  const handleActionPress = async (actionKey: string) => {
    if (!selectedItem) return;

    try {
      switch (actionKey) {
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

        case "edit":
          console.log(`Edit ${selectedItem.type} ${selectedItem.id}`);
          sheetRef.current?.close();
          // TODO: Navigate to edit screen
          break;

        case "share":
          console.log(`Share ${selectedItem.type} ${selectedItem.id}`);
          sheetRef.current?.close();
          // TODO: Implement share functionality
          break;

        case "delete":
          Alert.alert(
            "Delete Item",
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
                  console.log(`Delete ${selectedItem.type} ${selectedItem.id}`);
                  sheetRef.current?.close();
                  // TODO: Implement delete functionality
                },
              },
            ]
          );
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

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
      animationType="none"
    >
      {/* Backdrop */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          opacity: opacityAnim,
        }}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={{ flex: 1 }} />
        </TouchableWithoutFeedback>
      </Animated.View>

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
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
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
                  archiveTagMutation.isPending && item.key === "archive"
                    ? 0.5
                    : 1,
              }}
              onPress={() => handleActionPress(item.key)}
              disabled={archiveTagMutation.isPending && item.key === "archive"}
            >
              {archiveTagMutation.isPending && item.key === "archive" ? (
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
      </BottomSheet>
    </Modal>
  );
}
