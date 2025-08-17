// components/page/ImagePreviews.tsx - Separate image preview component
import { Image } from "expo-image";
import { ImageOff } from "lucide-react-native";
import React, { useState } from "react";
import { Text, View } from "react-native";
import { useNetworkStatus } from "../../store/syncStore";

// Individual image preview component
interface ImagePreviewProps {
  imageUrl: string;
  isOnline: boolean;
}

function ImagePreview({ imageUrl, isOnline }: ImagePreviewProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Don't render anything if offline
  if (!isOnline) {
    return null;
  }

  // Don't render if there was an error
  if (hasError) {
    return null;
  }

  return (
    <View className="w-20 h-20 bg-gray-100 rounded border overflow-hidden">
      <Image
        source={{ uri: imageUrl }}
        style={{ width: "100%", height: "100%" }}
        contentFit="cover"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        placeholder={undefined} // No placeholder for simplicity
      />
      {isLoading && (
        <View className="absolute inset-0 bg-gray-200 items-center justify-center">
          <View className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
        </View>
      )}
    </View>
  );
}

// Main image previews container component
interface ImagePreviewsProps {
  imagePreviews: string[];
  maxPreviews?: number;
}

export function ImagePreviews({
  imagePreviews,
  maxPreviews = 3,
}: ImagePreviewsProps) {
  const isOnline = useNetworkStatus();

  // Limit the number of previews shown
  const limitedPreviews = imagePreviews.slice(0, maxPreviews);

  // Don't render anything if no images
  if (limitedPreviews.length === 0) {
    return null;
  }

  return (
    <View className="mb-3">
      {/* Show actual images when online */}
      {isOnline && (
        <View className="flex-row space-x-2">
          {limitedPreviews.map((imageUrl: string, index: number) => (
            <ImagePreview key={index} imageUrl={imageUrl} isOnline={isOnline} />
          ))}
        </View>
      )}

      {/* Show offline indicator when offline and has images */}
      {!isOnline && (
        <View className="flex-row items-center py-2 px-3 bg-gray-50 rounded border border-gray-200">
          <ImageOff size={16} color="#9ca3af" />
          <Text className="text-gray-500 text-sm ml-2">
            {limitedPreviews.length} image
            {limitedPreviews.length > 1 ? "s" : ""} (offline)
          </Text>
        </View>
      )}
    </View>
  );
}
