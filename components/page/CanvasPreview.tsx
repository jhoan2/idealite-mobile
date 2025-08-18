// components/page/CanvasPreview.tsx - Simple canvas preview like ImagePreviews
import { Image } from "expo-image";
import { ImageOff } from "lucide-react-native";
import React, { useState } from "react";
import { Text, View } from "react-native";
import { useNetworkStatus } from "../../store/syncStore";

interface CanvasPreviewProps {
  canvasImageCid: string;
}

export function CanvasPreview({ canvasImageCid }: CanvasPreviewProps) {
  const isOnline = useNetworkStatus();
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Don't render anything if no CID
  if (!canvasImageCid) {
    return null;
  }

  return (
    <View className="mb-3">
      {/* Show actual canvas image when online */}
      {isOnline && !hasError && (
        <View className="w-20 h-20 bg-gray-100 rounded border overflow-hidden">
          <Image
            source={{
              uri: `${process.env.EXPO_PUBLIC_API_URL}/api/canvas/image/${canvasImageCid}`,
            }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
            placeholder={undefined}
          />
          {isLoading && (
            <View className="absolute inset-0 bg-gray-200 items-center justify-center">
              <View className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
            </View>
          )}
        </View>
      )}

      {/* Show offline indicator when offline */}
      {!isOnline && (
        <View className="flex-row items-center py-2 px-3 bg-gray-50 rounded border border-gray-200">
          <ImageOff size={16} color="#9ca3af" />
          <Text className="text-gray-500 text-sm ml-2">
            Canvas preview (offline)
          </Text>
        </View>
      )}
    </View>
  );
}
