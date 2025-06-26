import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// Note: You'll need to install expo-image-picker
// expo install expo-image-picker
import * as ImagePicker from "expo-image-picker";

// Define the user data type to match your web app
type UserData = {
  id: string;
  fullName?: string | null;
  username?: string | null;
  imageUrl?: string;
  email?: string | null;
};

interface SettingsProps {
  user: UserData;
}

export default function Settings({ user }: SettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [displayName, setDisplayName] = useState(user?.fullName || "");
  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState(user?.imageUrl || "");

  const handleImagePicker = async () => {
    try {
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
        // Here you would typically upload the image to your server
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleSave = () => {
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert("Success", "Profile updated successfully!");
    }, 1000);

    // Here you would make actual API calls to update user data
    console.log("Saving profile data:", {
      displayName,
      username,
      bio,
      profileImage,
    });
  };

  const handleCancel = () => {
    // Reset form to original values
    setDisplayName(user?.fullName || "");
    setUsername(user?.username || "");
    setBio("");
    setProfileImage(user?.imageUrl || "");
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["bottom"]}>
      <ScrollView
        contentContainerClassName="p-4"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-gray-900">
            Account Settings
          </Text>
        </View>

        {/* Profile Card */}
        <View className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <View className="p-6 pb-0">
            <Text className="text-xl font-semibold text-gray-900 mb-2">
              Profile Information
            </Text>
            <Text className="text-sm text-gray-500">
              Update your profile information and how others see you
            </Text>
          </View>

          <View className="p-6">
            {/* Profile Image Section */}
            <View className="items-center mb-6">
              <View className="relative">
                <Image
                  source={{
                    uri:
                      profileImage ||
                      "https://via.placeholder.com/96x96/f3f4f6/9ca3af?text=User",
                  }}
                  className="w-24 h-24 rounded-full bg-gray-100"
                />
                <TouchableOpacity
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-gray-500 justify-center items-center border-2 border-white"
                  onPress={handleImagePicker}
                >
                  <Ionicons name="camera" size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Form Fields */}
            <View className="gap-4">
              {/* Name and Username Row */}
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-900 mb-2">
                    Display name
                  </Text>
                  <TextInput
                    className="border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 bg-white"
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="Enter display name"
                  />
                </View>

                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-900 mb-2">
                    Username
                  </Text>
                  <TextInput
                    className="border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 bg-white"
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Enter username"
                  />
                </View>
              </View>

              {/* Email Field */}
              <View>
                <Text className="text-sm font-medium text-gray-900 mb-2">
                  Email
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-500 bg-gray-50"
                  value={user?.email || ""}
                  editable={false}
                />
                <Text className="text-xs text-gray-500 mt-1">
                  Your email address is managed by Clerk
                </Text>
              </View>

              {/* Bio Field */}
              <View>
                <Text className="text-sm font-medium text-gray-900 mb-2">
                  Bio
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 bg-white"
                  style={{ height: 100, textAlignVertical: "top" }}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Write a short bio about yourself"
                  multiline
                  numberOfLines={4}
                />
                <Text className="text-xs text-gray-500 mt-1">
                  Tell people a bit about yourself
                </Text>
              </View>
            </View>
          </View>

          {/* Footer Buttons */}
          <View className="flex-row justify-end gap-3 p-6 pt-4 border-t border-gray-200">
            <TouchableOpacity
              className="px-4 py-2.5 rounded-md border border-gray-300 bg-white"
              onPress={handleCancel}
            >
              <Text className="text-sm font-medium text-gray-700">Cancel</Text>
            </TouchableOpacity>

            {/* <TouchableOpacity
              className={`px-4 py-2.5 rounded-md bg-blue-500 ${
                isLoading ? "opacity-60" : ""
              }`}
              onPress={handleSave}
              disabled={isLoading}
            >
              <Text className="text-sm font-medium text-white">
                {isLoading ? "Saving..." : "Save changes"}
              </Text>
            </TouchableOpacity> */}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
