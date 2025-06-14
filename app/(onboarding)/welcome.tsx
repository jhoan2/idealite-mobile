// app/(onboarding)/welcome.tsx (Updated to use Clerk metadata)
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MultiSelectList } from "../../components/MultiSelectList";
import { useCompleteOnboarding } from "../../hooks/useOnboarding";
import { useTemplateTags } from "../../hooks/useTemplateTags";

export default function WelcomeScreen() {
  const router = useRouter();

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const {
    data: templateTags = [],
    isLoading,
    error,
    refetch: refetchTemplateTags,
  } = useTemplateTags();

  const completeOnboardingMutation = useCompleteOnboarding();

  const handleSubmit = async () => {
    if (selectedTagIds.length === 0) {
      Alert.alert(
        "Please select at least one category",
        "This helps us personalize your experience."
      );
      return;
    }

    try {
      await completeOnboardingMutation.mutateAsync({
        selectedTagIds: selectedTagIds,
      });

      // Navigate to home after successful completion
      router.replace("/(home)");
    } catch (error) {
      Alert.alert("Error", "Failed to complete onboarding. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#18181b" />
          <Text className="text-muted-foreground mt-4">
            Loading categories...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-destructive text-center text-lg mb-4">
            Failed to load categories
          </Text>
          <Text className="text-muted-foreground text-center mb-6">
            {error.message}
          </Text>
          <TouchableOpacity
            onPress={() => refetchTemplateTags()}
            className="bg-primary rounded-lg px-6 py-3"
          >
            <Text className="text-primary-foreground font-medium">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Convert template tags to MultiSelectList format
  const selectableItems = templateTags.map((tag: any) => ({
    id: tag.id,
    label: tag.name,
  }));

  const isSubmitting = completeOnboardingMutation.isPending;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 px-6 pt-16 pb-8">
          {/* Multi-select list */}
          <View className="flex-1 mb-8">
            {templateTags.length > 0 ? (
              <MultiSelectList
                items={selectableItems}
                selectedIds={selectedTagIds}
                onSelectionChange={setSelectedTagIds}
                title="What interests you?"
                subtitle="Select all categories that apply to help us personalize your experience"
              />
            ) : (
              <View className="flex-1 justify-center items-center">
                <Text className="text-muted-foreground text-center">
                  No categories available. Please contact support.
                </Text>
              </View>
            )}
          </View>

          {/* Submit button */}
          {templateTags.length > 0 && (
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting || selectedTagIds.length === 0}
              className={`
                rounded-xl py-4 px-8 flex-row items-center justify-center
                ${
                  selectedTagIds.length === 0 || isSubmitting
                    ? "bg-muted"
                    : "bg-primary"
                }
              `}
              activeOpacity={0.8}
            >
              {isSubmitting && (
                <ActivityIndicator
                  color="white"
                  size="small"
                  style={{ marginRight: 8 }}
                />
              )}
              <Text
                className={`
                text-center text-lg font-medium
                ${
                  selectedTagIds.length === 0 || isSubmitting
                    ? "text-muted-foreground"
                    : "text-primary-foreground"
                }
              `}
              >
                {isSubmitting ? "Setting up..." : "Get Started"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
