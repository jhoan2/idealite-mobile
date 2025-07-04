// components/page/ResourceCard.tsx
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenUrl = async () => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  const handleDelete = () => {
    if (!onDelete) return;

    Alert.alert(
      "Delete Resource",
      "Are you sure you want to remove this resource?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await onDelete(id);
            } catch (error) {
              console.error("Failed to delete resource:", error);
              Alert.alert(
                "Error",
                "Failed to delete resource. Please try again."
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
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
        {onDelete && (
          <TouchableOpacity
            onPress={handleDelete}
            disabled={isDeleting}
            className="p-1 rounded-full"
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#6b7280" />
            ) : (
              <Text className="text-gray-400 text-lg">×</Text>
            )}
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
