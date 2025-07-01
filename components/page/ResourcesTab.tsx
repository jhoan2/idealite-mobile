import React from "react";
import { ScrollView, Text, View } from "react-native";
import ResourceCard from "./ResourceCard";

interface Resource {
  id: string;
  type: string;
  title: string;
  description: string | null;
  url: string;
  image: string | null;
  author: string | null;
  date_published: Date | null;
}

interface ResourcesTabProps {
  resources: Resource[];
  pageId: string;
  onDeleteResource?: (resourceId: string) => void;
}

const ResourcesTab: React.FC<ResourcesTabProps> = ({
  resources,
  pageId,
  onDeleteResource,
}) => (
  <ScrollView className="flex-1 px-4">
    <View className="py-4">
      {resources.length === 0 ? (
        <View className="items-center py-8">
          <Text className="text-gray-500 text-center">
            No resources attached to this page
          </Text>
        </View>
      ) : (
        <View>
          {resources.map((resource) => (
            <ResourceCard
              key={resource.id}
              id={resource.id}
              type={resource.type}
              title={resource.title}
              description={resource.description || null}
              url={resource.url}
              image={resource.image || null}
              author={resource.author || null}
              date_published={resource.date_published || null}
              onDelete={onDeleteResource}
            />
          ))}
        </View>
      )}
    </View>
  </ScrollView>
);

export default ResourcesTab;
