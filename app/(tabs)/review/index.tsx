// app/(tabs)/review/index.tsx
import * as Sentry from "@sentry/react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ErrorScreen } from "../../../components/ErrorScreen";
import { LoadingScreen } from "../../../components/LoadingScreen";
import CardsDue from "../../../components/review/CardsDue";
import { useUserTags } from "../../../hooks/review/useFlashcards";

export default function ReviewScreen() {
  const { data: userTags, isLoading, error, refetch } = useUserTags();

  // Show loading state while fetching user tags
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Show error state if tag fetching failed
  if (error) {
    Sentry.captureException(
      new Error(error.message || "Failed to load user tags"),
      {
        tags: { component: "ReviewScreen" },
      }
    );

    return (
      <ErrorScreen
        message={error.message || "Failed to load your tags"}
        onRetry={refetch}
      />
    );
  }

  // Filter out any system tags (like root tag)
  const filteredTags =
    userTags?.filter(
      (tag: any) => tag.id !== "fbb1f204-6500-4b60-ab64-e1a9b3a5da88"
    ) || [];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <CardsDue tags={filteredTags} />
    </SafeAreaView>
  );
}
