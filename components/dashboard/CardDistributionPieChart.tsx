import { Dimensions, Text, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import type { CardStatusData } from "../../hooks/useDashboardData";

interface CardDistributionPieChartProps {
  data: CardStatusData[];
  totalCards: number;
}

export function CardDistributionPieChart({ data, totalCards }: CardDistributionPieChartProps) {
  if (!data || data.length === 0 || totalCards === 0) {
    return (
      <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <Text className="text-lg font-semibold text-gray-900 mb-4">
          📊 Card Distribution
        </Text>
        <View className="items-center justify-center py-8">
          <Text className="text-gray-500 text-center">No cards available</Text>
          <Text className="text-sm text-gray-400 text-center mt-1">
            Create some flashcards to see distribution
          </Text>
        </View>
      </View>
    );
  }

  const screenWidth = Dimensions.get('window').width;
  const chartSize = Math.min(screenWidth - 100, 200);

  // Transform the data for react-native-gifted-charts
  const pieData = data.map((item, index) => ({
    value: item.count,
    color: item.color,
    text: `${Math.round((item.count / totalCards) * 100)}%`,
    label: item.status,
    focused: index === 0, // Focus on first item by default
  }));

  const renderCenterLabel = () => {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>
          {totalCards}
        </Text>
        <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center' }}>
          Total Cards
        </Text>
      </View>
    );
  };

  return (
    <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <Text className="text-lg font-semibold text-gray-900 mb-4">
        📊 Card Distribution
      </Text>
      
      <View className="items-center">
        <PieChart
          data={pieData}
          radius={chartSize / 2 - 20}
          innerRadius={60}
          showText
          textSize={12}
          textColor="#374151"
          fontWeight="600"
          centerLabelComponent={renderCenterLabel}
          strokeWidth={2}
          strokeColor="#ffffff"
          showValuesAsLabels={false}
          showTextBackground={false}
          labelsPosition="mid"
        />
      </View>

      {/* Legend */}
      <View className="mt-6 gap-2">
        {data.map((item, index) => (
          <View key={index} className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View 
                className="w-3 h-3 rounded-full mr-3"
                style={{ backgroundColor: item.color }}
              />
              <Text className="text-sm text-gray-700 capitalize">
                {item.status}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-sm font-medium text-gray-900">
                {item.count.toLocaleString()}
              </Text>
              <Text className="text-xs text-gray-500 w-10 text-right">
                ({Math.round((item.count / totalCards) * 100)}%)
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Summary */}
      {totalCards > 0 && (
        <View className="mt-4 pt-4 border-t border-gray-100">
          <Text className="text-xs text-gray-500 text-center">
            Distribution of {totalCards.toLocaleString()} total flashcards
          </Text>
        </View>
      )}
    </View>
  );
}