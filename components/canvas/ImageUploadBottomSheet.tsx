import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";

interface ImageData {
  id: number;
  uri: string;
}

export default function ImageUploadBottomSheet() {
  const [image, setImage] = useState<ImageData | null>(null);

  const handleAttachClick = async () => {
    // Request permissions
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "Permission to access camera roll is required!"
      );
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
      base64: false, // Set to true if you need base64
    });

    if (!result.canceled && result.assets[0]) {
      setImage({
        id: Date.now(),
        uri: result.assets[0].uri,
      });
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
  };

  return (
    <View className="flex-1 p-5">
      <Text className="text-lg font-bold mb-5">Image Tools</Text>

      {/* Image Preview Section */}
      {image && (
        <View className="mb-4 p-3 border border-gray-300 rounded-lg bg-white">
          <View className="relative">
            <Image
              source={{ uri: image.uri }}
              style={{
                width: "100%",
                height: 200,
                borderRadius: 8,
              }}
              contentFit="cover"
            />
            {/* Remove button */}
            <TouchableOpacity
              onPress={handleRemoveImage}
              className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 rounded-full w-8 h-8 items-center justify-center"
            >
              <Text className="text-white text-lg font-bold">✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Upload Button */}
      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={handleAttachClick}
          className="bg-gray-100 rounded-full w-12 h-12 items-center justify-center"
        >
          <Ionicons name="attach" size={20} color="#666" />
        </TouchableOpacity>

        {/* Add more buttons here later */}
      </View>
    </View>
  );
}
