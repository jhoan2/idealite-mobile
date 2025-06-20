// app/(tabs)/home/index.tsx - Complete Dashboard Implementation
import { useAuth } from "@clerk/clerk-expo";
import * as Sentry from "@sentry/react-native";
import React, { useCallback } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CardActivityStats } from "../../../components/dashboard/CardActivityStats";
import { CardStatusPieChart } from "../../../components/dashboard/CardStatusPieChart";
import { DashboardError } from "../../../components/dashboard/DashboardError";
import { DashboardLoading } from "../../../components/dashboard/DashboardLoading";
import StackedHorizontalBarChart from "../../../components/dashboard/StackedHorizontalBarChart";
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
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
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
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
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
          {/* Header */}
          <View className="mb-6">
            <Text className="text-foreground text-2xl font-bold mb-2">
              Dashboard
            </Text>
            <Text className="text-muted-foreground">
              Track your learning progress and activity
            </Text>
          </View>

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
                <StackedHorizontalBarChart />
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
                    💡 Start by creating your first flashcard to begin tracking
                    your learning journey!
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
