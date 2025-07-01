// components/page/TagList.tsx
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

interface Tag {
  id: string;
  name: string;
}

interface TagListProps {
  /** Tags currently attached */
  tags: Tag[];
  /** Tags available to add */
  availableTags: Tag[];
  /** Called when removing a tag */
  onRemoveTag: (id: string) => Promise<void>;
  /** Called when adding a tag */
  onAddTag: (id: string) => Promise<void>;
}

export const TagList: React.FC<TagListProps> = ({
  tags,
  availableTags,
  onRemoveTag,
  onAddTag,
}) => {
  return (
    <View className="px-4 pt-4">
      {/* Current Tags */}
      <Text className="text-base font-semibold mb-2">Tags</Text>
      <View className="flex-row flex-wrap mb-4">
        {tags.map((tag) => (
          <View
            key={tag.id}
            className="flex-row items-center bg-yellow-100 rounded-full py-1 px-3 mr-2 mb-2"
          >
            <Text className="text-sm text-yellow-600 mr-2">{tag.name}</Text>
            <TouchableOpacity onPress={() => void onRemoveTag(tag.id)}>
              <Text className="text-red-600 text-sm">×</Text>
            </TouchableOpacity>
          </View>
        ))}
        {tags.length === 0 && (
          <Text className="text-sm text-gray-500">No tags attached.</Text>
        )}
      </View>

      {/* Available Tags */}
      <Text className="text-base font-semibold mb-2">Add Tags</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 4 }}
      >
        {availableTags.map((tag) => (
          <TouchableOpacity
            key={tag.id}
            onPress={() => void onAddTag(tag.id)}
            className="bg-green-100 rounded-full py-1 px-3 mr-2"
          >
            <Text className="text-sm text-green-600">+ {tag.name}</Text>
          </TouchableOpacity>
        ))}
        {availableTags.length === 0 && (
          <Text className="text-sm text-gray-500">
            No tags available to add.
          </Text>
        )}
      </ScrollView>
    </View>
  );
};

export default TagList;
