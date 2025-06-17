// app/(tabs)/home/index.tsx - Updated with safe area insets
import { useAuth } from "@clerk/clerk-expo";
import * as Sentry from "@sentry/react-native";
import React, { useCallback } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CardActivityStats } from "../../../components/dashboard/CardActivityStats";
import { DashboardError } from "../../../components/dashboard/DashboardError";
import { DashboardLoading } from "../../../components/dashboard/DashboardLoading";
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
          <Text className="text-foreground text-2xl font-bold mb-4">
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
          paddingBottom: insets.bottom + 16, // Add bottom padding + extra space
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor="#18181b"
            colors={["#18181b"]}
          />
        }
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
              <View className="mb-6">
                <CardActivityStats stats={dashboardData.cardActivity} />
              </View>

              {/* Placeholder for future charts */}
              <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <Text className="text-lg font-semibold text-gray-900 mb-2">
                  Charts Coming Soon
                </Text>
                <Text className="text-sm text-gray-600">
                  Tag mastery and card distribution charts will be added here
                  using Victory Native.
                </Text>

                {/* Show some data preview */}
                <View className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <Text className="text-xs text-gray-500 mb-1">
                    Data Preview:
                  </Text>
                  <Text className="text-sm text-gray-700">
                    Total Cards: {dashboardData.totalCards}
                  </Text>
                  <Text className="text-sm text-gray-700">
                    Tags with Data: {dashboardData.tagMastery.length}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            // Fallback empty state
            <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <View className="items-center">
                <Text className="text-lg font-semibold text-gray-900 mb-2">
                  No Data Available
                </Text>
                <Text className="text-sm text-gray-600 text-center">
                  Create some flashcards to see your dashboard statistics
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
