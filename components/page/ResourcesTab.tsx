import React from "react";
import { ScrollView, Text, View } from "react-native";

interface Resource {
  id: string;
  title: string;
  url: string;
  description: string | null;
  author: string | null;
  date_published: Date | null;
  image: string | null;
  type: string;
  og_type: string | null;
  created_at: Date;
  updated_at: Date | null;
}

interface ResourcesTabProps {
  resources: Resource[];
  pageId: string;
}

const ResourcesTab: React.FC<ResourcesTabProps> = ({ resources, pageId }) => (
  <ScrollView className="flex-1 px-4">
    <View className="py-4">
      {resources.length === 0 ? (
        <View className="items-center py-8">
          <Text className="text-gray-500 text-center">
            No resources attached to this page
          </Text>
        </View>
      ) : (
        <View className="space-y-3">
          {resources.map((resource) => (
            <View key={resource.id} className="bg-gray-50 rounded-lg p-3">
              <Text className="font-medium text-gray-900 mb-1">
                {resource.title}
              </Text>
              {resource.description && (
                <Text className="text-sm text-gray-600 mb-2">
                  {resource.description}
                </Text>
              )}
              <Text className="text-xs text-blue-600" numberOfLines={1}>
                {resource.url}
              </Text>
              {resource.author && (
                <Text className="text-xs text-gray-500 mt-1">
                  by {resource.author}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  </ScrollView>
);

export default ResourcesTab;
