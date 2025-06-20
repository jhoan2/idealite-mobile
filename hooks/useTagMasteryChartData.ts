// src/hooks/useTagMasteryChartData.ts
import { useDashboardData, type TagMasteryData } from "./useDashboardData";

/**
 * Transforms raw tag mastery stats into the `stackData` format
 * expected by react-native-gifted-charts' BarChart.
 */
export type StackDatum = {
  /** Array of stack segments for each bar */
  stacks: {
    value: number;
    color: string;
    barWidth: number;
    barBorderRadius: number;
    marginBottom?: number;
  }[];
  label: string;
};

export function useTagMasteryChartData(): StackDatum[] {
  const { data } = useDashboardData();
  if (!data) return [];

  // Constants for styling
  const BAR_WIDTH = 16;
  const BORDER_RADIUS = BAR_WIDTH / 2;
  const COLORS = ["#10b981", "#3b82f6", "#6b7280"]; // mastered, active, suspended

  return data.tagMastery.map((t: TagMasteryData) => ({
    label: t.name,
    stacks: [
      {
        value: t.mastered,
        color: COLORS[0],
        barWidth: BAR_WIDTH,
        barBorderRadius: BORDER_RADIUS,
        marginBottom: 2,
      },
      {
        value: t.active,
        color: COLORS[1],
        barWidth: BAR_WIDTH,
        barBorderRadius: BORDER_RADIUS,
        marginBottom: 2,
      },
      {
        value: t.suspended,
        color: COLORS[2],
        barWidth: BAR_WIDTH,
        barBorderRadius: BORDER_RADIUS,
      },
    ],
  }));
}
