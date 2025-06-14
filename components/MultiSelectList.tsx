// components/MultiSelectList.tsx
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface SelectableItem {
  id: string;
  label: string;
  description?: string;
}

interface MultiSelectListProps {
  items: SelectableItem[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  title?: string;
  subtitle?: string;
}

export function MultiSelectList({
  items,
  selectedIds,
  onSelectionChange,
  title,
  subtitle,
}: MultiSelectListProps) {
  const toggleSelection = (id: string) => {
    const newSelection = selectedIds.includes(id)
      ? selectedIds.filter((selectedId) => selectedId !== id)
      : [...selectedIds, id];

    onSelectionChange(newSelection);
  };

  return (
    <View>
      {title && (
        <Text className="text-foreground text-xl font-bold mb-2">{title}</Text>
      )}
      {subtitle && (
        <Text className="text-muted-foreground text-base mb-6">{subtitle}</Text>
      )}

      <View>
        {items.map((item, index) => {
          const isSelected = selectedIds.includes(item.id);
          const isLastItem = index === items.length - 1;

          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => toggleSelection(item.id)}
              className={`
                p-4 rounded-xl border-2 ${!isLastItem ? "mb-3" : ""}
                ${
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background"
                }
              `}
              activeOpacity={0.8}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text
                    className={`
                    text-base font-medium
                    ${isSelected ? "text-primary" : "text-foreground"}
                  `}
                  >
                    {item.label}
                  </Text>
                  {item.description && (
                    <Text className="text-muted-foreground text-sm mt-1">
                      {item.description}
                    </Text>
                  )}
                </View>

                {/* Selection indicator */}
                <View
                  className={`
                  w-6 h-6 rounded-full border-2 ml-3 items-center justify-center
                  ${
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  }
                `}
                >
                  {isSelected && (
                    <Text className="text-primary-foreground text-xs font-bold">
                      ✓
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selection count */}
      <Text className="text-muted-foreground text-sm mt-4 text-center">
        {selectedIds.length} selected
      </Text>
    </View>
  );
}
