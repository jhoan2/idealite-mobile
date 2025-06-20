// src/components/StackedHorizontalBarChart.tsx
import React from "react";
import { Dimensions, Text, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { useTagMasteryChartData } from "../../hooks/useTagMasteryChartData";

/**
 * Renders a horizontal, stacked bar chart with tooltips
 * showing full tag names and detailed mastery stats
 */
export default function StackedHorizontalBarChart() {
  const stackData = useTagMasteryChartData();
  const screenWidth = Dimensions.get("window").width;

  if (!stackData.length) {
    return (
      <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <Text className="text-lg font-semibold text-gray-900 mb-1 text-center">
          Tag Mastery Progress
        </Text>
        <Text className="text-sm text-gray-600 mb-4 text-center">
          By learning status
        </Text>
        <View className="flex-1 items-center justify-center py-8">
          <Text className="text-gray-500 text-center">No data available</Text>
          <Text className="text-sm text-gray-400 text-center mt-1">
            Create some flashcards to see tag progress
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <Text className="text-lg pt-6 font-semibold text-gray-900 mb-1 text-center">
        Tag Mastery Progress
      </Text>
      <Text className="text-sm text-gray-600 mb-6 text-center">
        Tap any bar to see detailed stats
      </Text>

      {/* Legend */}
      <View className="flex-row justify-center items-center  gap-6">
        <View className="flex-row items-center">
          <View className="w-3 h-3 bg-green-500 rounded-sm mr-2" />
          <Text className="text-xs text-gray-700">Mastered</Text>
        </View>
        <View className="flex-row items-center">
          <View className="w-3 h-3 bg-blue-500 rounded-sm mr-2" />
          <Text className="text-xs text-gray-700">Active</Text>
        </View>
        <View className="flex-row items-center">
          <View className="w-3 h-3 bg-gray-500 rounded-sm mr-2" />
          <Text className="text-xs text-gray-700">Suspended</Text>
        </View>
      </View>

      {/* Chart */}
      <View className="pb-6">
        <BarChart
          width={screenWidth - 120}
          stackData={stackData}
          horizontal
          rotateLabel
          noOfSections={4}
          spacing={18}
          // Styling
          yAxisTextStyle={{
            fontSize: 10,
            color: "#6b7280",
          }}
          xAxisLabelTextStyle={{
            fontSize: 10,
            color: "#6b7280",
          }}
          // Animation
          isAnimated
          animationDuration={800}
        />
      </View>
    </View>
  );
}
