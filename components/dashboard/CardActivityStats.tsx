// components/dashboard/CardActivityStats.tsx
import React from "react";
import { View } from "react-native";
import { CardActivityStats as CardActivityStatsType } from "../../hooks/useDashboardData";
import { StatCard } from "./StatCard";

interface CardActivityStatsProps {
  stats: CardActivityStatsType;
}

export function CardActivityStats({ stats }: CardActivityStatsProps) {
  return (
    <View className="gap-3">
      {/* Top Row */}
      <View className="flex-row gap-3">
        <View className="flex-1">
          <StatCard
            title="New Cards"
            value={stats.cardsCreatedThisWeek}
            changePercent={stats.createdChangePercent}
            icon="add-circle-outline"
            description="Created this week"
            color="blue"
          />
        </View>
        <View className="flex-1">
          <StatCard
            title="Cards Reviewed"
            value={stats.cardsReviewedThisWeek}
            changePercent={stats.reviewedChangePercent}
            icon="time-outline"
            description="In the past 7 days"
            color="green"
          />
        </View>
      </View>

      {/* Bottom Row */}
      <View className="flex-row gap-3">
        <View className="flex-1">
          <StatCard
            title="Due Soon"
            value={stats.cardsDueThisWeek}
            changePercent={stats.dueChangePercent}
            icon="calendar-outline"
            description="Coming up this week"
            color="amber"
          />
        </View>
        <View className="flex-1">
          <StatCard
            title="Review Rate"
            value={stats.reviewCompletionRate}
            changePercent={stats.completionRateChange}
            icon="checkmark-circle-outline"
            description="Overdue cards reviewed"
            isPercentage={true}
            isPercentagePoint={true}
            color="rose"
          />
        </View>
      </View>
    </View>
  );
}
