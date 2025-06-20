// components/dashboard/StatCard.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

type StatCardProps = {
  title: string;
  value: number;
  changePercent: number;
  icon: keyof typeof Ionicons.glyphMap;
  description?: string;
  isPercentage?: boolean;
  isPercentagePoint?: boolean;
  color?: "default" | "blue" | "green" | "amber" | "rose";
};

const colorStyles = {
  default: {
    background: "bg-gray-50",
    text: "text-gray-900",
    icon: "#18181b",
  },
  blue: {
    background: "bg-blue-50",
    text: "text-blue-900",
    icon: "#3b82f6",
  },
  green: {
    background: "bg-green-50",
    text: "text-green-900",
    icon: "#10b981",
  },
  amber: {
    background: "bg-amber-50",
    text: "text-amber-900",
    icon: "#f59e0b",
  },
  rose: {
    background: "bg-rose-50",
    text: "text-rose-900",
    icon: "#ef4444",
  },
};

export function StatCard({
  title,
  value,
  changePercent,
  icon,
  description,
  isPercentage = false,
  isPercentagePoint = false,
  color = "default",
}: StatCardProps) {
  const isIncrease = changePercent > 0;
  const isDecrease = changePercent < 0;
  const isZero = changePercent === 0;

  const trendIcon = isIncrease
    ? "trending-up"
    : isDecrease
    ? "trending-down"
    : "remove";

  const trendColor = isIncrease
    ? "text-green-600"
    : isDecrease
    ? "text-rose-600"
    : "text-gray-500";

  const styles = colorStyles[color];

  return (
    <View
      className={`${styles.background} rounded-xl p-4 shadow-sm border border-gray-200 min-h-[120px]`}
    >
      {/* Header Row */}
      <View className="flex-row items-start justify-between mb-3 flex-1">
        <View className="flex-1 justify-between">
          <View>
            <Text className="text-sm font-medium text-gray-600 mb-1">
              {title}
            </Text>

            {/* Value and Trend */}
            <View className="flex-row items-baseline">
              <Text className={`text-2xl font-bold ${styles.text}`}>
                {value.toLocaleString()}
                {isPercentage && "%"}
              </Text>

              {changePercent !== undefined && !isZero && (
                <View className={`ml-2 flex-row items-center ${trendColor}`}>
                  <Ionicons
                    name={trendIcon}
                    size={12}
                    color={
                      trendColor.includes("green")
                        ? "#16a34a"
                        : trendColor.includes("rose")
                        ? "#dc2626"
                        : "#6b7280"
                    }
                  />
                  <Text className={`text-xs font-medium ml-1 ${trendColor}`}>
                    {isPercentagePoint
                      ? `${isIncrease ? "+" : ""}${changePercent} pts`
                      : `${isIncrease ? "+" : ""}${changePercent}%`}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Description at bottom */}
          {description && (
            <Text className="text-xs text-gray-500 mt-auto">{description}</Text>
          )}
        </View>

        {/* Icon */}
        <View className={`${styles.background} rounded-full p-3 ml-3`}>
          <Ionicons name={icon} size={20} color={styles.icon} />
        </View>
      </View>
    </View>
  );
}
