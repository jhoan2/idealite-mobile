// components/ProfileHeader.tsx
import { useUser } from "@clerk/clerk-expo";
import { Settings } from "lucide-react-native";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface ProfileHeaderProps {
  onSettingsPress?: () => void;
}

export function ProfileHeader({ onSettingsPress }: ProfileHeaderProps) {
  const { user } = useUser();

  // Generate initials from user's name
  const getInitials = (name: string | null | undefined): string => {
    if (!name) return "U";

    const nameParts = name.trim().split(" ");
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }

    return (
      nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)
    ).toUpperCase();
  };

  const displayName =
    user?.fullName ||
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
    "User";
  const displayEmail = user?.primaryEmailAddress?.emailAddress || "No email";
  const initials = getInitials(displayName);

  return (
    <View className="flex-row items-center justify-between px-4 py-3">
      {/* Avatar and User Info */}
      <View className="flex-row items-center flex-1">
        {/* Avatar */}
        <View className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center mr-3">
          {user?.imageUrl ? (
            <Image
              source={{ uri: user.imageUrl }}
              className="w-10 h-10 rounded-full"
              resizeMode="cover"
            />
          ) : (
            <Text className="text-white font-semibold text-sm">{initials}</Text>
          )}
        </View>

        {/* User Details */}
        <View className="flex-1">
          <Text
            className="text-foreground font-semibold text-base"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {displayName}
          </Text>
          <Text
            className="text-muted-foreground text-sm"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {displayEmail}
          </Text>
        </View>
      </View>

      {/* Settings Icon */}
      <TouchableOpacity
        onPress={onSettingsPress}
        className="p-2 -mr-2"
        activeOpacity={0.7}
      >
        <Settings size={20} color="#71717a" />
      </TouchableOpacity>
    </View>
  );
}
