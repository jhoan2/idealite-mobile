// components/dashboard/CardStatusPieChart.tsx
import React from "react";
import { Dimensions, Text, View } from "react-native";
import { PieChart } from "react-native-gifted-charts";
import type { CardStatusData } from "../../hooks/useDashboardData";

interface CardStatusPieChartProps {
  data: CardStatusData[];
  totalCards: number;
}

interface PieChartDataItem {
  value: number;
  color: string;
  text?: string;
  textColor?: string;
  textSize?: number;
  shiftTextX?: number;
  shiftTextY?: number;
}

const { width: screenWidth } = Dimensions.get("window");
const CHART_SIZE = Math.min(screenWidth * 0.6, 200);

export function CardStatusPieChart({
  data,
  totalCards,
}: CardStatusPieChartProps) {
  if (!data || data.length === 0 || totalCards === 0) {
    return (
      <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <Text className="text-lg font-semibold text-gray-900 mb-1 text-center">
          Card Status Distribution
        </Text>
        <Text className="text-sm text-gray-600 mb-4 text-center">
          By learning status
        </Text>
        <View className="flex-1 items-center justify-center py-8">
          <Text className="text-gray-500 text-center">No cards available</Text>
          <Text className="text-sm text-gray-400 text-center mt-1">
            Create some flashcards to see distribution
          </Text>
        </View>
      </View>
    );
  }

  // Transform data for the pie chart
  const pieData: PieChartDataItem[] = data.map((item) => {
    const percentage = Math.round((item.count / totalCards) * 100);

    return {
      value: item.count,
      color: getColorForStatus(item.status),
      text: percentage > 5 ? `${percentage}%` : "", // Only show percentage if > 5%
      textColor: "#ffffff",
      textSize: 12,
    };
  });

  // Get the largest segment for highlighting
  const largestSegment = data.reduce((prev, current) =>
    prev.count > current.count ? prev : current
  );

  return (
    <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      {/* Header */}
      <Text className="text-lg font-semibold text-gray-900 mb-1 text-center">
        Card Status Distribution
      </Text>
      <Text className="text-sm text-gray-600 mb-6 text-center">
        By learning status
      </Text>

      {/* Chart Container */}
      <View className="items-center mb-6">
        <View className="relative">
          <PieChart
            data={pieData}
            radius={CHART_SIZE / 2}
            strokeColor="white"
            strokeWidth={2}
            showText={true}
            textColor="white"
            textSize={12}
            isAnimated={true}
            animationDuration={800}
            centerLabelComponent={() => (
              <View className="items-center">
                <Text className="text-2xl font-bold text-gray-900">
                  {totalCards.toLocaleString()}
                </Text>
                <Text className="text-xs text-gray-500">Total Cards</Text>
              </View>
            )}
          />
        </View>
      </View>

      {/* Legend */}
      <View className="gap-3">
        {data
          .sort((a, b) => b.count - a.count) // Sort by count descending
          .map((item) => {
            const percentage = Math.round((item.count / totalCards) * 100);
            const isLargest = item.status === largestSegment.status;

            return (
              <View
                key={item.status}
                className="flex-row items-center justify-between"
              >
                <View className="flex-row items-center flex-1">
                  <View
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: getColorForStatus(item.status) }}
                  />
                  <Text
                    className={`text-sm ${
                      isLargest
                        ? "font-semibold text-gray-900"
                        : "text-gray-700"
                    }`}
                  >
                    {item.status}
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <Text
                    className={`text-lg mr-2 ${
                      isLargest
                        ? "font-bold text-gray-900"
                        : "font-semibold text-gray-800"
                    }`}
                  >
                    {item.count.toLocaleString()}
                  </Text>
                  <Text className="text-sm text-gray-500 w-12 text-right">
                    {percentage}%
                  </Text>
                </View>
              </View>
            );
          })}
      </View>
    </View>
  );
}

// Helper function to get consistent colors for each status
function getColorForStatus(status: string): string {
  switch (status.toLowerCase()) {
    case "learning":
    case "active":
      return "#3B82F6"; // blue-500
    case "mastered":
      return "#10B981"; // green-500
    case "paused":
    case "suspended":
      return "#6B7280"; // gray-500
    case "new":
      return "#F59E0B"; // amber-500
    case "review":
      return "#EF4444"; // red-500
    default:
      // Generate a color based on the status string for consistency
      const colors = [
        "#8B5CF6", // violet-500
        "#EC4899", // pink-500
        "#06B6D4", // cyan-500
        "#84CC16", // lime-500
        "#F97316", // orange-500
      ];
      const index = status.length % colors.length;
      return colors[index];
  }
}
