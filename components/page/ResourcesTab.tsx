import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useDebouncedCallback } from "use-debounce";
import { useApiClient } from "../../lib/api/client";
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
  onRefetch?: () => void; // Add refetch function
}

interface PreviewData {
  title: string;
  description: string;
  image: string;
  url: string;
  author: string | null;
  date_published: string | null;
  type: string;
  og_type?: string;
  html?: string; // For Twitter embeds
}

const ResourcesTab: React.FC<ResourcesTabProps> = ({
  resources,
  pageId,
  onDeleteResource,
  onRefetch,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apiClient = useApiClient();

  // Debounced function to fetch preview data
  const fetchPreviewData = useDebouncedCallback(async (url: string) => {
    if (!url.trim()) {
      setPreviewData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let response;
      if (url.includes("twitter.com") || url.includes("x.com")) {
        response = await apiClient.get(
          `/api/twitter?url=${encodeURIComponent(url)}`
        );
      } else {
        response = await apiClient.get(
          `/api/resource?type=url&query=${encodeURIComponent(url)}`
        );
      }

      setPreviewData(response);
    } catch (err: any) {
      console.error("Error fetching preview:", err);
      setError("Failed to fetch URL preview");
    } finally {
      setIsLoading(false);
    }
  }, 1000);

  const handleUrlChange = (text: string) => {
    setUrlInput(text);
    fetchPreviewData(text);
  };

  const handleAddResource = async () => {
    if (!previewData) return;

    setIsCreating(true);
    try {
      const resourceData = {
        url: previewData.url,
        type: "url",
        title: previewData.title || "",
        description: previewData.description || "",
        image: previewData.image || undefined,
        author: previewData.author || undefined,
        og_type: previewData.og_type || undefined,
        date_published: previewData.date_published
          ? new Date(previewData.date_published)
          : undefined,
        page_id: pageId,
      };

      await apiClient.post(`/api/v1/pages/${pageId}/resources`, resourceData);

      // Reset state
      setUrlInput("");
      setPreviewData(null);
      setIsExpanded(false);
      setError(null);

      // Refresh the resources list
      onRefetch?.();

      Alert.alert("Success", "Resource added successfully!");
    } catch (err: any) {
      console.error("Error creating resource:", err);
      Alert.alert("Error", "Failed to add resource. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const isTwitterUrl = (url: string) => {
    return url.includes("twitter.com") || url.includes("x.com");
  };

  const formatDate = (date: string | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <View className="py-4">
      {/* Header with Add Resource Button */}
      <View className="px-4 mb-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-gray-900">Resources</Text>
          <TouchableOpacity
            onPress={() => setIsExpanded(!isExpanded)}
            className={`px-4 py-2 rounded-lg ${
              isExpanded ? "bg-gray-200" : "bg-blue-500"
            }`}
            disabled={isCreating}
          >
            <Text
              className={`text-sm font-medium ${
                isExpanded ? "text-gray-700" : "text-white"
              }`}
            >
              {isExpanded ? "Cancel" : "Add Resource"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Expandable Add Resource Section */}
        {isExpanded && (
          <View className="mt-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
            {/* URL Input */}
            <TextInput
              placeholder="Enter URL"
              value={urlInput}
              onChangeText={handleUrlChange}
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

            {/* Loading Indicator */}
            {isLoading && (
              <View className="flex-row items-center justify-center py-4">
                <ActivityIndicator size="small" color="#3b82f6" />
                <Text className="ml-2 text-gray-600">Fetching preview...</Text>
              </View>
            )}

            {/* Error Display */}
            {error && (
              <View className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <Text className="text-red-700 text-sm">{error}</Text>
              </View>
            )}

            {/* Preview Display */}
            {previewData && !error && (
              <View className="mt-4 border border-gray-200 rounded-lg bg-white overflow-hidden">
                {/* Twitter Embed Preview */}
                {isTwitterUrl(previewData.url) && previewData.html ? (
                  <View className="p-4">
                    <View className="flex-row items-center mb-2">
                      <Text className="text-sm text-gray-500">
                        🐦 Twitter Post
                      </Text>
                    </View>
                    <Text className="font-semibold text-gray-900">
                      {previewData.title}
                    </Text>
                    <Text className="text-gray-600 mt-1">
                      {previewData.description}
                    </Text>
                    {previewData.author && (
                      <Text className="text-sm text-gray-500 mt-2">
                        By {previewData.author}
                      </Text>
                    )}
                  </View>
                ) : (
                  /* Regular URL Preview */
                  <View className="p-4">
                    <View className="flex-row">
                      {previewData.image && (
                        <Image
                          source={{ uri: previewData.image }}
                          className="w-20 h-20 rounded-lg mr-4"
                          resizeMode="cover"
                        />
                      )}
                      <View className="flex-1">
                        <View className="flex-row items-center mb-2">
                          <Text className="text-sm text-gray-500">
                            🔗 {previewData.type}
                          </Text>
                        </View>
                        <Text className="font-semibold text-gray-900 mb-2">
                          {previewData.title}
                        </Text>
                        <Text
                          className="text-gray-600 text-sm leading-5"
                          numberOfLines={3}
                        >
                          {previewData.description}
                        </Text>
                        {(previewData.author || previewData.date_published) && (
                          <View className="mt-2 space-y-1">
                            {previewData.author && (
                              <Text className="text-xs text-gray-500">
                                👤 {previewData.author}
                              </Text>
                            )}
                            {previewData.date_published && (
                              <Text className="text-xs text-gray-500">
                                📅 {formatDate(previewData.date_published)}
                              </Text>
                            )}
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                )}

                {/* Add Resource Button */}
                <View className="border-t border-gray-200 p-4">
                  <TouchableOpacity
                    onPress={handleAddResource}
                    disabled={isCreating}
                    className={`py-3 rounded-lg ${
                      isCreating ? "bg-gray-300" : "bg-blue-500"
                    }`}
                  >
                    {isCreating ? (
                      <View className="flex-row items-center justify-center">
                        <ActivityIndicator size="small" color="#6b7280" />
                        <Text className="ml-2 text-gray-600 font-medium">
                          Adding Resource...
                        </Text>
                      </View>
                    ) : (
                      <Text className="text-white font-medium text-center">
                        Add Resource
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Resources List */}
      {resources.length === 0 ? (
        <View className="items-center py-8">
          <Text className="text-gray-500 text-center">
            No resources attached to this page
          </Text>
        </View>
      ) : (
        <View className="flex-1 px-4">
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
  );
};

export default ResourcesTab;
