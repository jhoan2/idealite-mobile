// components/dashboard/DashboardLoading.tsx
import React from "react";
import { View } from "react-native";

// Simple skeleton box component
function SkeletonBox({ className }: { className: string }) {
  return <View className={`bg-gray-200 rounded animate-pulse ${className}`} />;
}

// Skeleton for individual stat card
function StatCardSkeleton() {
  return (
    <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          {/* Title */}
          <SkeletonBox className="h-4 w-20 mb-2" />

          {/* Value and trend */}
          <View className="flex-row items-baseline">
            <SkeletonBox className="h-8 w-12" />
            <SkeletonBox className="h-4 w-8 ml-2" />
          </View>

          {/* Description */}
          <SkeletonBox className="h-3 w-24 mt-2" />
        </View>

        {/* Icon circle */}
        <SkeletonBox className="w-12 h-12 rounded-full ml-3" />
      </View>
    </View>
  );
}

// Skeleton for TagMasteryChart
function TagMasteryChartSkeleton() {
  return (
    <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
      {/* Header */}
      <SkeletonBox className="h-6 w-48 mb-1" />
      <SkeletonBox className="h-4 w-64 mb-4" />

      {/* Tag items */}
      <View className="gap-4">
        {[...Array(4)].map((_, index) => (
          <View key={index} className="gap-2">
            {/* Tag name and stats */}
            <View className="flex-row items-center justify-between">
              <SkeletonBox className="h-4 w-24 flex-1" />
              <View className="flex-row items-center gap-2">
                <SkeletonBox className="h-4 w-8" />
                <SkeletonBox className="h-4 w-12" />
              </View>
            </View>

            {/* Progress bar */}
            <SkeletonBox className="h-6 w-full rounded-full" />

            {/* Detailed breakdown */}
            <View className="flex-row justify-between">
              <SkeletonBox className="h-3 w-16" />
              <SkeletonBox className="h-3 w-16" />
              <SkeletonBox className="h-3 w-12" />
            </View>
          </View>
        ))}
      </View>

      {/* Legend */}
      <View className="flex-row justify-center items-center mt-4 gap-6 pt-4 border-t border-gray-100">
        {[...Array(3)].map((_, index) => (
          <View key={index} className="flex-row items-center">
            <SkeletonBox className="w-3 h-3 rounded-sm mr-2" />
            <SkeletonBox className="h-3 w-12" />
          </View>
        ))}
      </View>
    </View>
  );
}

// Skeleton for CardStatusChart
function CardStatusChartSkeleton() {
  return (
    <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 h-full">
      {/* Header */}
      <SkeletonBox className="h-6 w-36 mb-1 mx-auto" />
      <SkeletonBox className="h-4 w-32 mb-6 mx-auto" />

      {/* Total Cards Display */}
      <View className="items-center mb-6 p-4 bg-gray-50 rounded-lg">
        <SkeletonBox className="h-8 w-16 mb-1" />
        <SkeletonBox className="h-4 w-20" />
      </View>

      {/* Status Bars */}
      <View className="flex-1 gap-4">
        {[...Array(3)].map((_, index) => (
          <View key={index} className="mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <SkeletonBox className="w-4 h-4 rounded-sm mr-3" />
                <SkeletonBox className="h-4 w-16" />
              </View>

              <View className="flex-row items-center">
                <SkeletonBox className="h-5 w-8 mr-2" />
                <SkeletonBox className="h-4 w-8" />
              </View>
            </View>

            {/* Progress bar */}
            <SkeletonBox className="h-3 w-full rounded-full" />
          </View>
        ))}
      </View>

      {/* Summary */}
      <View className="pt-4 border-t border-gray-100">
        <SkeletonBox className="h-3 w-48 mx-auto" />
      </View>
    </View>
  );
}

export function DashboardLoading() {
  return (
    <View className="gap-6">
      {/* Card Activity Stats */}
      <View className="gap-3">
        {/* Top Row */}
        <View className="flex-row gap-3">
          <View className="flex-1">
            <StatCardSkeleton />
          </View>
          <View className="flex-1">
            <StatCardSkeleton />
          </View>
        </View>

        {/* Bottom Row */}
        <View className="flex-row gap-3">
          <View className="flex-1">
            <StatCardSkeleton />
          </View>
          <View className="flex-1">
            <StatCardSkeleton />
          </View>
        </View>
      </View>

      {/* Charts Section */}
      <View className="gap-4">
        {/* Tag Mastery Chart */}
        <TagMasteryChartSkeleton />

        {/* Card Status Distribution Chart */}
        <CardStatusChartSkeleton />
      </View>
    </View>
  );
}
