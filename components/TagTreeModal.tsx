// components/TagTreeModal.tsx
import { Ionicons } from "@expo/vector-icons";
import * as Sentry from "@sentry/react-native";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
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

  // Animation refs
  const slideAnim = useRef(new Animated.Value(-MODAL_WIDTH)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

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
    </Modal>
  );
}
