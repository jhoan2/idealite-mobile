// components/dashboard/CardStatusChart.tsx
import React from "react";
import { Text, View } from "react-native";
import type { CardStatusData } from "../../hooks/useDashboardData";

interface CardStatusChartProps {
  data: CardStatusData[];
  totalCards: number;
}

interface StatusBarProps {
  status: string;
  count: number;
  percentage: number;
  color: string;
  isLargest?: boolean;
}

const StatusBar: React.FC<StatusBarProps> = ({
  status,
  count,
  percentage,
  color,
  isLargest = false,
}) => {
  return (
    <View className="mb-4">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <View
            className="w-4 h-4 rounded-sm mr-3"
            style={{ backgroundColor: color }}
          />
          <Text className="text-sm font-medium text-gray-900">{status}</Text>
        </View>

        <View className="flex-row items-center">
          <Text className="text-lg font-bold text-gray-900 mr-2">{count}</Text>
          <Text className="text-sm text-gray-500 w-12 text-right">
            {percentage}%
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <View
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
            opacity: isLargest ? 1 : 0.8,
          }}
        />
      </View>
    </View>
  );
};

export function CardStatusChart({ data, totalCards }: CardStatusChartProps) {
  if (!data || data.length === 0 || totalCards === 0) {
    return (
      <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 h-full">
        <Text className="text-lg font-semibold text-gray-900 mb-1 text-center">
          Card Distribution
        </Text>
        <Text className="text-sm text-gray-600 mb-4 text-center">
          By learning status
        </Text>
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500 text-center">No cards available</Text>
          <Text className="text-sm text-gray-400 text-center mt-1">
            Create some flashcards to see distribution
          </Text>
        </View>
      </View>
    );
  }

  // Define consistent colors
  const getColorForStatus = (status: string) => {
    switch (status) {
      case "Learning":
        return "#3B82F6"; // blue-500
      case "Mastered":
        return "#10B981"; // green-500
      case "Paused":
        return "#6B7280"; // gray-500
      default:
        return "#6B7280";
    }
  };

  // Calculate percentages and find largest category
  const chartData = data.map((item) => ({
    ...item,
    percentage: Math.round((item.count / totalCards) * 100),
    color: getColorForStatus(item.status),
  }));

  const largestCategory = chartData.reduce((prev, current) =>
    prev.count > current.count ? prev : current
  );

  return (
    <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 h-full">
      <Text className="text-lg font-semibold text-gray-900 mb-1 text-center">
        Card Distribution
      </Text>
      <Text className="text-sm text-gray-600 mb-6 text-center">
        By learning status
      </Text>

      {/* Total Cards Display */}
      <View className="items-center mb-6 p-4 bg-gray-50 rounded-lg">
        <Text className="text-3xl font-bold text-gray-900">
          {totalCards.toLocaleString()}
        </Text>
        <Text className="text-sm text-gray-500">Total Cards</Text>
      </View>

      {/* Status Bars */}
      <View className="flex-1">
        {chartData
          .sort((a, b) => b.count - a.count) // Sort by count descending
          .map((item, index) => (
            <StatusBar
              key={item.status}
              status={item.status}
              count={item.count}
              percentage={item.percentage}
              color={item.color}
              isLargest={item.status === largestCategory.status}
            />
          ))}
      </View>

      {/* Summary */}
      <View className="pt-4 border-t border-gray-100">
        <Text className="text-xs text-gray-500 text-center leading-relaxed">
          {largestCategory.status} cards make up the largest portion (
          {largestCategory.percentage}%) of your collection
        </Text>
      </View>
    </View>
  );
}
