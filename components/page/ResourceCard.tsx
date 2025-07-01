// components/page/ResourceCard.tsx
import React, { useState } from "react";
import { Image, Linking, Text, TouchableOpacity, View } from "react-native";

interface ResourceCardProps {
  id: string;
  type: string;
  title: string;
  description: string | null;
  url: string;
  image: string | null;
  author: string | null;
  date_published: Date | null;
  onDelete?: (resourceId: string) => void;
}

const ResourceCard: React.FC<ResourceCardProps> = ({
  id,
  type,
  title,
  description,
  url,
  image,
  author,
  date_published,
  onDelete,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getTypeIcon = () => {
    switch (type) {
      case "book":
        return "📚";
      case "research-paper":
        return "🔬";
      default:
        return "🔗";
    }
  };

  const handleOpenUrl = async () => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const truncatedDescription =
    description && description.length > 100
      ? description.substring(0, 100) + "..."
      : description;

  return (
    <View className="bg-white rounded-lg border border-gray-200 mb-3 overflow-hidden">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center">
          <Text className="text-lg mr-2">{getTypeIcon()}</Text>
          <Text className="text-sm text-gray-500 capitalize">{type}</Text>
        </View>
        {onDelete && (
          <TouchableOpacity
            onPress={() => onDelete(id)}
            className="p-1 rounded-full"
          >
            <Text className="text-gray-400 text-lg">×</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View className="p-4">
        <View className="flex-row">
          {/* Image */}
          {image && (
            <TouchableOpacity onPress={handleOpenUrl} className="mr-4">
              <Image
                source={{ uri: image }}
                className="w-20 h-20 rounded-lg"
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}

          {/* Main Content */}
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </Text>

            {/* Description */}
            {description && (
              <View className="mb-3">
                <Text className="text-sm text-gray-600 leading-5">
                  {isExpanded ? description : truncatedDescription}
                </Text>
                {description.length > 100 && (
                  <TouchableOpacity
                    onPress={() => setIsExpanded(!isExpanded)}
                    className="mt-1"
                  >
                    <Text className="text-sm text-blue-600">
                      {isExpanded ? "Show less" : "Show more"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Metadata */}
            <View className="space-y-1">
              {author && (
                <View className="flex-row items-center">
                  <Text className="text-xs text-gray-500 mr-1">👤</Text>
                  <Text className="text-xs text-gray-600">{author}</Text>
                </View>
              )}
              {date_published && (
                <View className="flex-row items-center">
                  <Text className="text-xs text-gray-500 mr-1">📅</Text>
                  <Text className="text-xs text-gray-600">
                    {formatDate(date_published)}
                  </Text>
                </View>
              )}
              <TouchableOpacity onPress={handleOpenUrl} className="mt-2">
                <Text className="text-xs text-blue-600" numberOfLines={1}>
                  {url}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ResourceCard;
