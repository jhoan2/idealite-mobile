// components/PageInfoModal.tsx
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { usePage } from "../hooks/page/usePage";
import { useApiClient } from "../lib/api/client";
import ResourcesTab from "./page/ResourcesTab";
import TagList from "./page/TagList";

interface PageInfoModalProps {
  visible: boolean;
  onClose: () => void;
  pageId: string | null;
}

type TabType = "tags" | "resources";

interface TabButtonProps {
  title: string;
  isActive: boolean;
  onPress: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ title, isActive, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    className={`px-4 py-2 rounded-lg mx-1 relative ${
      isActive ? "bg-blue-500" : "bg-gray-100"
    }`}
  >
    <Text
      className={`font-medium ${isActive ? "text-white" : "text-gray-700"}`}
    >
      {title}
    </Text>
  </TouchableOpacity>
);

export function PageInfoModal({
  visible,
  onClose,
  pageId,
}: PageInfoModalProps) {
  const sheetRef = useRef<BottomSheet>(null);
  const { page, isLoading, error, refetch } = usePage(pageId || "");
  const apiClient = useApiClient();
  const [activeTab, setActiveTab] = useState<TabType>("tags");

  useEffect(() => {
    if (visible && pageId) {
      sheetRef.current?.snapToIndex(0);
      setActiveTab("tags");
    } else {
      sheetRef.current?.close();
    }
  }, [visible, pageId]);

  const availableTags = useMemo(() => {
    if (!page?.userTagTree) return [];
    const flatten = (ts: any[]): any[] =>
      ts.flatMap((t) =>
        t.children?.length ? [t, ...flatten(t.children)] : [t]
      );
    const all = flatten(page.userTagTree);
    const attached = page?.tags?.map((t) => t.id) || [];
    return all.filter((t) => !attached.includes(t.id));
  }, [page?.userTagTree, page?.tags]);

  if (!pageId) return null;

  const handleClose = () => onClose();

  const handleAddTag = async (tagId: string) => {
    try {
      await apiClient.post(`/api/v1/pages/${pageId}/tags`, { tagId });
      refetch();
    } catch (error) {
      console.error("Failed to add tag:", error);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    try {
      await apiClient.delete(`/api/v1/pages/${pageId}/tags/${tagId}`);
      refetch();
    } catch (error) {
      console.error("Failed to remove tag:", error);
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    try {
      await apiClient.delete(`/api/v1/pages/${pageId}/resources/${resourceId}`);
      refetch();
    } catch (error) {
      console.error("Failed to delete resource:", error);
    }
  };

  const tabs = [
    { id: "tags" as TabType, title: "Tags" },
    { id: "resources" as TabType, title: "Resources" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "tags":
        return (
          <TagList
            tags={page?.tags || []}
            availableTags={availableTags}
            onRemoveTag={handleRemoveTag}
            onAddTag={handleAddTag}
          />
        );
      case "resources":
        return (
          <ResourcesTab
            resources={page?.resources || []}
            pageId={pageId}
            onDeleteResource={handleDeleteResource}
            onRefetch={refetch}
          />
        );
      default:
        return null;
    }
  };

  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={["50%", "75%", "90%"]}
      enablePanDownToClose
      enableDynamicSizing={false}
      onClose={handleClose}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
        />
      )}
      backgroundStyle={{ backgroundColor: "#FFFFFF" }}
      handleIndicatorStyle={{ backgroundColor: "#D1D5DB", width: 40 }}
    >
      <BottomSheetScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
        showsVerticalScrollIndicator
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-2 pb-4 border-b border-gray-200">
          <Text className="text-lg font-medium">Page Info</Text>
          <TouchableOpacity onPress={handleClose}>
            <Text className="text-base text-gray-600">Close</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View className="flex-row px-4 py-3 border-b border-gray-100">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              title={tab.title}
              isActive={activeTab === tab.id}
              onPress={() => setActiveTab(tab.id)}
            />
          ))}
        </View>

        {/* Tab Content */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-500">Loading...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center px-4">
            <Text className="text-red-500 text-center">
              Failed to load page information
            </Text>
            <TouchableOpacity onPress={() => refetch()} className="mt-2">
              <Text className="text-blue-500">Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          renderTabContent()
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

export default PageInfoModal;
