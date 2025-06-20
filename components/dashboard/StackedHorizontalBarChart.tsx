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
      <View style={{ padding: 16, alignItems: "center" }}>
        <Text>No data available</Text>
      </View>
    );
  }

  return (
    <View>
      <View>
        {/* Chart Title */}
        <Text
          style={{
            fontSize: 18,
            fontWeight: "bold",
            marginBottom: 8,
            color: "#111827",
          }}
        >
          Tag Mastery Progress
        </Text>

        {/* Subtitle */}
        <Text
          style={{
            fontSize: 14,
            color: "#6b7280",
            marginBottom: 16,
          }}
        >
          Tap any bar to see detailed stats
        </Text>

        {/* Legend */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 12,
                height: 12,
                backgroundColor: "#10b981",
                borderRadius: 6,
                marginRight: 4,
              }}
            />
            <Text style={{ fontSize: 11, color: "#374151" }}>Mastered</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 12,
                height: 12,
                backgroundColor: "#3b82f6",
                borderRadius: 6,
                marginRight: 4,
              }}
            />
            <Text style={{ fontSize: 11, color: "#374151" }}>Active</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 12,
                height: 12,
                backgroundColor: "#6b7280",
                borderRadius: 6,
                marginRight: 4,
              }}
            />
            <Text style={{ fontSize: 11, color: "#374151" }}>Suspended</Text>
          </View>
        </View>
      </View>

      {/* Chart */}
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
  );
}
