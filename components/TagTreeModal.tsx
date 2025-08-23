// components/TagTreeModal.tsx - Simplified component with only tags
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
import { useCreateTag } from "../hooks/useCreateTag";
import { useTagTree } from "../hooks/useTagTree";
import { TreeTag } from "../lib/api/tagTree";
import { TagTreeModalHeader } from "./TagTreeModalHeader";

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
    isTagExpanded,
    hasPendingUpdates,
    forceSyncPendingUpdates,
    showArchived,
    toggleShowArchived,
    filteredTagTree,
  } = useTagTree();

  // Add tag creation state
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagName, setTagName] = useState("");

  // Add the create tag mutation
  const createTagMutation = useCreateTag();

  // Animation refs
  const slideAnim = useRef(new Animated.Value(-MODAL_WIDTH)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // BottomSheet setup
  const sheetRef = useRef<BottomSheet>(null);
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    title: string;
    type: "tag";
  } | null>(null);

  const snapPoints = useMemo(() => ["25%", "50%", "75%"], []);

  const actions = useMemo(() => {
    const baseActions = [];

    // Show create actions based on item type
    if (selectedItem?.type === "tag") {
      if (!showTagInput) {
        baseActions.push({
          key: "create-tag",
          label: "Create Tag",
          icon: "pricetags-outline",
        });
        baseActions.push({
          key: "delete",
          label: "Delete",
          icon: "trash-outline",
        });
      }
    }

    return baseActions;
  }, [selectedItem?.type, showTagInput]);

  const openSheet = (item: { id: string; title: string; type: "tag" }) => {
    setSelectedItem(item);
    sheetRef.current?.snapToIndex(2);
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

        case "delete":
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
                  console.log(`Delete tag ${selectedItem.id}`);
                  sheetRef.current?.close();
                  // TODO: Implement delete tag functionality
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

  // Reset inputs when modal closes or item changes
  useEffect(() => {
    if (!visible) {
      setShowTagInput(false);
      setTagName("");
    }
  }, [visible]);

  useEffect(() => {
    setShowTagInput(false);
    setTagName("");
  }, [selectedItem]);

  // Simplified recursive tag renderer - only tags
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
              paddingVertical: 8,
              paddingHorizontal: 4,
              borderRadius: 6,
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
            name="pricetag"
            size={16}
            color="#4B5563"
            style={{ marginLeft: 8 }}
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

        {/* Child Tags Only */}
        {isExpanded && tag.children && tag.children.length > 0 && (
          <View style={{ marginTop: 4 }}>
            {tag.children.map((child: TreeTag) => renderTag(child, level + 1))}
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

    if (filteredTagTree.length === 0) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 32,
          }}
        >
          <Ionicons name="pricetag-outline" size={48} color="#6B7280" />
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
        {filteredTagTree.map((tag) => renderTag(tag))}
      </ScrollView>
    );
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
        {/* Use the separated header component */}
        <TagTreeModalHeader onClose={onClose} />

        {/* Content */}
        {renderContent()}
      </Animated.View>

      {/* Action Bottom Sheet */}
      <BottomSheet
        ref={sheetRef}
        index={-1}
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
            Tag
          </Text>
        </View>

        {showTagInput ? (
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
                    createTagMutation.isPending && item.key === "create-tag"
                      ? 0.5
                      : 1,
                }}
                onPress={() => handleActionPress(item.key)}
                disabled={
                  createTagMutation.isPending && item.key === "create-tag"
                }
              >
                {createTagMutation.isPending && item.key === "create-tag" ? (
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
    </>
  );
}
