// app/(tabs)/home/index.tsx - Complete Dashboard Implementation
import { useAuth } from "@clerk/clerk-expo";
import * as Sentry from "@sentry/react-native";
import { useCallback } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CardActivityStats } from "../../../components/dashboard/CardActivityStats";
import { CardDistributionPieChart } from "../../../components/dashboard/CardDistributionPieChart";
import { CardStatusChart } from "../../../components/dashboard/CardStatusChart";
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
              <View className="mb-6">
                <CardActivityStats stats={dashboardData.cardActivity} />
              </View>

              {/* Charts Section */}
              <View className="gap-4">
                {/* Card Distribution Pie Chart */}
                <CardDistributionPieChart
                  data={dashboardData.cardDistribution}
                  totalCards={dashboardData.totalCards}
                />

                {/* Tag Mastery Chart */}

                {/* Card Status Distribution Chart */}
                <CardStatusChart
                  data={dashboardData.cardDistribution}
                  totalCards={dashboardData.totalCards}
                />
              </View>

              {/* Quick Insights Section */}
              {dashboardData.totalCards > 0 && (
                <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mt-4">
                  <Text className="text-lg font-semibold text-gray-900 mb-4">
                    📊 Quick Insights
                  </Text>

                  <View className="gap-3">
                    <View className="flex-row items-center">
                      <View className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
                      <Text className="text-sm text-gray-700 flex-1">
                        You have {dashboardData.totalCards.toLocaleString()}{" "}
                        total flashcards
                      </Text>
                    </View>

                    {dashboardData.cardActivity.cardsCreatedThisWeek > 0 && (
                      <View className="flex-row items-center">
                        <View className="w-2 h-2 bg-green-500 rounded-full mr-3" />
                        <Text className="text-sm text-gray-700 flex-1">
                          Created{" "}
                          {dashboardData.cardActivity.cardsCreatedThisWeek} new
                          cards this week
                        </Text>
                      </View>
                    )}

                    {dashboardData.cardActivity.cardsDueThisWeek > 0 && (
                      <View className="flex-row items-center">
                        <View className="w-2 h-2 bg-amber-500 rounded-full mr-3" />
                        <Text className="text-sm text-gray-700 flex-1">
                          {dashboardData.cardActivity.cardsDueThisWeek} cards
                          due this week
                        </Text>
                      </View>
                    )}

                    {dashboardData.tagMastery.length > 0 && (
                      <View className="flex-row items-center">
                        <View className="w-2 h-2 bg-purple-500 rounded-full mr-3" />
                        <Text className="text-sm text-gray-700 flex-1">
                          Tracking progress across{" "}
                          {dashboardData.tagMastery.length} subjects
                        </Text>
                      </View>
                    )}

                    {dashboardData.cardActivity.reviewCompletionRate > 0 && (
                      <View className="flex-row items-center">
                        <View className="w-2 h-2 bg-rose-500 rounded-full mr-3" />
                        <Text className="text-sm text-gray-700 flex-1">
                          {dashboardData.cardActivity.reviewCompletionRate}%
                          review completion rate
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Study Tip Section */}
              {dashboardData.totalCards > 0 && (
                <View className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mt-4 border border-blue-100">
                  <Text className="text-lg font-semibold text-blue-900 mb-2">
                    💡 Study Tip
                  </Text>
                  <Text className="text-sm text-blue-700 leading-relaxed">
                    {dashboardData.cardActivity.cardsDueThisWeek > 0
                      ? "You have cards due this week! Regular review sessions help improve long-term retention."
                      : dashboardData.cardActivity.cardsCreatedThisWeek > 0
                      ? "Great job creating new cards! Try to review them within 24 hours for better retention."
                      : "Consider creating new flashcards for topics you're currently studying to reinforce your learning."}
                  </Text>
                </View>
              )}
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
