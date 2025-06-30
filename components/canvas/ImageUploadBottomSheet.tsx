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
  onAddToCanvas?: (message: any) => void;
}

export default function ImageUploadBottomSheet({
  authToken,
  onAddToCanvas,
}: ImageUploadBottomSheetProps) {
  const [image, setImage] = useState<ImageData | null>(null);
  const [showEditInput, setShowEditInput] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [description, setDescription] = useState("");

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
      base64: false,
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
      const formData = new FormData();
      formData.append("image", {
        uri: image.uri,
        type: "image/jpeg",
        name: "image.jpg",
      } as any);
      formData.append("prompt", editPrompt);

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
        setImage({
          id: Date.now(),
          uri: data.image,
        });
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

  const handleAddToCanvas = async () => {
    if (!image) {
      Alert.alert("Error", "Please select an image first");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", {
        uri: image.uri,
        type: "image/jpeg",
        name: "test-image.jpg",
      } as any);

      const uploadResult = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/image/cloudflare`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const uploadData = await uploadResult.json();

      if (uploadResult.ok && uploadData.cloudflareData?.url) {
        const message = {
          type: "IMAGE_UPLOADED",
          imageUrl: uploadData.cloudflareData.url,
          cloudflareKey: uploadData.cloudflareData.key,
          description: description.trim(),
        };

        if (onAddToCanvas) {
          onAddToCanvas(message);
        }

        setImage(null);
        setDescription("");
        Alert.alert("Success", "Image sent to canvas!");
      } else {
        Alert.alert("Error", uploadData.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Error", "Upload failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 p-5">
      <Text className="text-lg font-bold mb-5">Image Tools</Text>

      {/* Image + Description Card - Show when image exists */}
      {image && (
        <View className="mb-4 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Image Section */}
          <View className="relative">
            <Image
              source={{ uri: image.uri }}
              style={{
                width: "100%",
                height: 200,
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

          {/* Description Section - Inside the card */}
          <View className="p-4">
            <Text className="text-sm font-medium mb-2 text-gray-700">
              Describe this image for flashcards:
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="e.g., A diagram showing the water cycle process..."
              multiline
              numberOfLines={3}
              className="border border-gray-300 rounded-lg p-3 text-base bg-gray-50"
              style={{ textAlignVertical: "top" }}
            />
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

      {/* Action Buttons */}
      <View className="flex-row justify-between items-center">
        {/* Left side: attach + edit buttons */}
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={handleAttachClick}
            className="bg-gray-100 rounded-full w-12 h-12 items-center justify-center"
            disabled={isLoading}
          >
            <Ionicons name="attach" size={20} color="#666" />
          </TouchableOpacity>

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

        {/* Right side: add-to-canvas button */}
        {image && (
          <TouchableOpacity
            onPress={handleAddToCanvas}
            className="bg-gray-100 rounded-full w-12 h-12 items-center justify-center"
            disabled={isLoading}
          >
            <Ionicons name="arrow-up-outline" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
