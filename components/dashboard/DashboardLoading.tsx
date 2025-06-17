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

export function DashboardLoading() {
  return (
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
  );
}
