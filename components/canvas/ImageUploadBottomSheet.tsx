import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface ImageData {
  id: number;
  uri: string;
}

interface ImageUploadBottomSheetProps {
  authToken: string;
}

export default function ImageUploadBottomSheet({
  authToken,
}: ImageUploadBottomSheetProps) {
  const [image, setImage] = useState<ImageData | null>(null);
  const [showEditInput, setShowEditInput] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  const handleEditImage = async () => {
    if (!image || !editPrompt.trim()) {
      Alert.alert("Error", "Please add a description for editing the image");
      return;
    }

    setIsLoading(true);

    try {
      // Create FormData for React Native
      const formData = new FormData();

      // In React Native, we can pass the URI directly to FormData
      formData.append("image", {
        uri: image.uri,
        type: "image/jpeg", // or detect from the image
        name: "image.jpg",
      } as any);

      formData.append("prompt", editPrompt);

      // Make API call
      const result = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/memory-palace/edit/gemini`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const data = await result.json();

      if (data.success && data.image) {
        // Update image with the edited version
        setImage({
          id: Date.now(),
          uri: data.image, // This should be a base64 data URL
        });

        // Reset edit state
        setEditPrompt("");
        setShowEditInput(false);
      } else {
        Alert.alert("Error", data.error || "Failed to edit image");
      }
    } catch (error) {
      console.error("Error editing image:", error);
      Alert.alert("Error", "Failed to edit image");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setShowEditInput(false);
    setEditPrompt("");
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

      {/* Edit Input Section */}
      {image && showEditInput && (
        <View className="mb-4 p-3 border border-gray-300 rounded-lg bg-white">
          <Text className="text-sm font-medium mb-2">
            Describe how to edit this image:
          </Text>
          <TextInput
            value={editPrompt}
            onChangeText={setEditPrompt}
            placeholder="e.g., make the background blue, add a sunset..."
            multiline
            numberOfLines={3}
            className="border border-gray-300 rounded-lg p-3 text-base"
            style={{ textAlignVertical: "top" }}
          />
          <View className="flex-row gap-2 mt-3">
            <TouchableOpacity
              onPress={() => {
                setShowEditInput(false);
                setEditPrompt("");
              }}
              className="flex-1 bg-gray-200 rounded-lg py-3 items-center"
              disabled={isLoading}
            >
              <Text className="text-gray-700 font-medium">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleEditImage}
              className="flex-1 bg-blue-500 rounded-lg py-3 items-center"
              disabled={isLoading || !editPrompt.trim()}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-white font-medium">Edit Image</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Upload Button */}
      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={handleAttachClick}
          className="bg-gray-100 rounded-full w-12 h-12 items-center justify-center"
          disabled={isLoading}
        >
          <Ionicons name="attach" size={20} color="#666" />
        </TouchableOpacity>

        {/* Edit Image Button - only show when image is present */}
        {image && (
          <TouchableOpacity
            onPress={() => setShowEditInput(!showEditInput)}
            className={`rounded-full w-12 h-12 items-center justify-center ${
              showEditInput ? "bg-blue-500" : "bg-gray-100"
            }`}
            disabled={isLoading}
          >
            <Ionicons
              name="create-outline"
              size={20}
              color={showEditInput ? "white" : "#666"}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
