// app/(tabs)/home/index.tsx - Updated with bottom sheet management
import { useAuth } from "@clerk/clerk-expo";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import * as Sentry from "@sentry/react-native";
import * as Haptics from "expo-haptics";
import { Pin, PinOff } from "lucide-react-native";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CardActivityStats } from "../../../components/dashboard/CardActivityStats";
import { CardStatusPieChart } from "../../../components/dashboard/CardStatusPieChart";
import { DashboardError } from "../../../components/dashboard/DashboardError";
import { DashboardLoading } from "../../../components/dashboard/DashboardLoading";
import { TagHierarchyBrowser } from "../../../components/dashboard/TagHierarchyBrowser";
import {
  useToggleTagPin,
  type TagHierarchyNode,
} from "../../../hooks/dashboard/useTagHierarchy";
import { useDashboardData } from "../../../hooks/useDashboardData";

export default function HomeScreen() {
  const { isSignedIn } = useAuth();
  const insets = useSafeAreaInsets();
  const {
    data: dashboardData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useDashboardData();

  // Bottom sheet state
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [selectedTag, setSelectedTag] = useState<TagHierarchyNode | null>(null);
  const snapPoints = useMemo(() => ["25%", "50%"], []);
  const togglePinMutation = useToggleTagPin();

  // Handle tag long press from TagHierarchyBrowser
  const handleTagLongPress = useCallback((tag: TagHierarchyNode) => {
    setSelectedTag(tag);
    bottomSheetRef.current?.snapToIndex(1);
  }, []);

  // Handle closing bottom sheet
  const handleCloseBottomSheet = useCallback(() => {
    bottomSheetRef.current?.close();
    setSelectedTag(null);
  }, []);

  // Handle pin/unpin action
  const handleTogglePin = useCallback(async () => {
    if (!selectedTag) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await togglePinMutation.mutateAsync({
        tagId: selectedTag.id,
        isPinned: !selectedTag.isPinned,
      });

      handleCloseBottomSheet();

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to update pin status");
    }
  }, [selectedTag, togglePinMutation, handleCloseBottomSheet]);

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    try {
      await refetch();
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          component: "HomeScreen",
          action: "refresh",
        },
      });
    }
  }, [refetch]);

  // Unauthenticated state
  if (!isSignedIn) {
    return (
      <View className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-foreground text-2xl font-bold mb-4 text-center">
            Welcome to Idealite
          </Text>
          <Text className="text-muted-foreground text-center">
            Sign in to view your dashboard and track your learning progress
          </Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <View className="flex-1 bg-gray-50">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: insets.bottom + 16,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              tintColor="#18181b"
              colors={["#18181b"]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View className="p-4">
            {/* Dashboard Content */}
            {isLoading ? (
              <DashboardLoading />
            ) : error ? (
              <DashboardError
                error={error.message || "An unexpected error occurred"}
                onRetry={onRefresh}
              />
            ) : dashboardData ? (
              <>
                {/* Card Activity Stats */}
                <View className="gap-4">
                  <CardActivityStats stats={dashboardData.cardActivity} />

                  {/* Pass the callback to TagHierarchyBrowser */}
                  <TagHierarchyBrowser
                    maxHeight={400}
                    onTagLongPress={handleTagLongPress}
                  />

                  <CardStatusPieChart
                    data={dashboardData.cardDistribution}
                    totalCards={dashboardData.totalCards}
                  />
                </View>
              </>
            ) : (
              // Fallback empty state
              <View className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
                <View className="items-center">
                  <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                    <Text className="text-2xl">📚</Text>
                  </View>

                  <Text className="text-lg font-semibold text-gray-900 mb-2 text-center">
                    No Data Available
                  </Text>

                  <Text className="text-sm text-gray-600 text-center mb-4">
                    Create some flashcards to see your dashboard statistics and
                    track your learning progress.
                  </Text>

                  <View className="bg-blue-50 rounded-lg p-4 w-full">
                    <Text className="text-xs text-blue-700 text-center">
                      💡 Start by creating your first flashcard to begin
                      tracking your learning journey!
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Bottom Sheet for Tag Actions */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        backgroundStyle={{ backgroundColor: "#ffffff" }}
        handleIndicatorStyle={{ backgroundColor: "#D1D5DB" }}
      >
        <BottomSheetView className="flex-1 px-6 pb-6">
          {selectedTag && (
            <>
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                {selectedTag.name}
              </Text>

              <Pressable
                onPress={handleTogglePin}
                disabled={togglePinMutation.isPending}
                style={({ pressed }) => [
                  {
                    backgroundColor: pressed ? "#F3F4F6" : "#F9FAFB",
                    opacity: togglePinMutation.isPending ? 0.6 : 1,
                  },
                ]}
                className="flex-row items-center p-4 rounded-lg"
              >
                {selectedTag.isPinned ? (
                  <>
                    <PinOff size={20} color="#6B7280" />
                    <Text className="text-gray-900 font-medium ml-3">
                      Unpin from Quick Access
                    </Text>
                  </>
                ) : (
                  <>
                    <Pin size={20} color="#6B7280" />
                    <Text className="text-gray-900 font-medium ml-3">
                      Pin to Quick Access
                    </Text>
                  </>
                )}

                {togglePinMutation.isPending && (
                  <ActivityIndicator
                    size="small"
                    color="#6B7280"
                    style={{ marginLeft: "auto" }}
                  />
                )}
              </Pressable>
            </>
          )}
        </BottomSheetView>
      </BottomSheet>
    </>
  );
}
