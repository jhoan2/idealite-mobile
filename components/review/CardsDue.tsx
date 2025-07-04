// components/review/CardsDue.tsx
import { Ionicons } from "@expo/vector-icons";
import * as Sentry from "@sentry/react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDueFlashcards } from "../../hooks/review/useFlashcards";
import FlashcardReview from "./FlashcardReview";

interface Tag {
  id: string;
  name: string;
}

interface CardsDueProps {
  tags?: Tag[];
}

export default function CardsDue({ tags }: CardsDueProps) {
  const { top, bottom } = useSafeAreaInsets();
  // State for filtering and review
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCount, setSelectedCount] = useState<number>(20);
  const [reviewing, setReviewing] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState(false);
  // Modal states
  const [showTagModal, setShowTagModal] = useState(false);
  const [showCountModal, setShowCountModal] = useState(false);

  // Fetch due cards count
  const {
    data: dueData,
    isLoading: dueLoading,
    error: dueError,
    refetch: refetchDue,
  } = useDueFlashcards({
    status: "active",
    tags: selectedTags,
    getCards: false,
  });

  // Fetch actual cards when reviewing
  const {
    data: cardsData,
    isLoading: cardsLoading,
    error: cardsError,
    refetch: refetchCards,
  } = useDueFlashcards({
    status: "active",
    tags: selectedTags,
    getCards: true,
    limit: selectedCount,
  });

  const dueCardCount = dueData?.count || 0;
  const dueCards = cardsData?.cards || [];

  // Initialize selected count based on due cards
  useEffect(() => {
    if (!isInitialized && dueCardCount > 0) {
      setSelectedCount(Math.min(dueCardCount, 20));
      setIsInitialized(true);
    }
  }, [dueCardCount, isInitialized]);

  // Handle tag selection
  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tagId)) {
        return prev.filter((id) => id !== tagId);
      } else {
        return [...prev, tagId];
      }
    });
  };

  // Handle count selection
  const handleCountSelection = (percentage: number) => {
    if (percentage === 0) {
      setSelectedCount(10);
    } else {
      const count = Math.floor((dueCardCount * percentage) / 100);
      setSelectedCount(count > 0 ? count : 1);
    }
    setShowCountModal(false);
  };

  // Start review session
  const handleReview = async () => {
    try {
      if (dueCardCount === 0) {
        Alert.alert("No Cards", "No cards are due for review.");
        return;
      }

      // Fetch the cards for review
      await refetchCards();
      setReviewing(true);
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          component: "CardsDue",
          action: "start_review",
        },
      });
      Alert.alert("Error", "Failed to start review session. Please try again.");
    }
  };

  // Complete review session
  const handleReviewComplete = () => {
    setReviewing(false);
    refetchDue(); // Refresh due count
  };

  // Count modal options
  const countOptions = useMemo(() => {
    const options = [
      {
        label: `${Math.floor(dueCardCount)} (100%)`,
        value: 100,
        count: dueCardCount,
      },
      {
        label: `${Math.floor(dueCardCount * 0.75)} (75%)`,
        value: 75,
        count: Math.floor(dueCardCount * 0.75),
      },
      {
        label: `${Math.floor(dueCardCount * 0.5)} (50%)`,
        value: 50,
        count: Math.floor(dueCardCount * 0.5),
      },
      {
        label: `${Math.floor(dueCardCount * 0.25)} (25%)`,
        value: 25,
        count: Math.floor(dueCardCount * 0.25),
      },
    ];

    if (dueCardCount >= 10) {
      options.push({
        label: "10 cards",
        value: 0,
        count: 10,
      });
    }

    return options;
  }, [dueCardCount]);

  // Show review session
  if (reviewing && dueCards.length > 0) {
    return (
      <FlashcardReview cards={dueCards} onComplete={handleReviewComplete} />
    );
  }

  // Show loading state
  if (dueLoading) {
    return (
      <View className="flex-1 bg-background" style={{ paddingTop: top }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#18181b" />
          <Text className="text-muted-foreground mt-4">Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: top }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 16,
          paddingBottom: bottom + 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-6 pt-4">
          <Text className="text-2xl font-bold text-foreground mb-2">
            Review Cards
          </Text>
          <Text className="text-muted-foreground">
            Study your flashcards with spaced repetition
          </Text>
        </View>

        {/* Filter Controls */}
        <View className="flex-row gap-3 mb-6">
          {/* Tag Filter Button */}
          <TouchableOpacity
            onPress={() => setShowTagModal(true)}
            className="flex-1 bg-white border border-border rounded-xl p-4 flex-row items-center justify-between shadow-sm"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <Ionicons name="pricetag-outline" size={20} color="#6B7280" />
              <Text className="text-foreground font-medium ml-2">
                Filter Tags
              </Text>
            </View>
            <View className="flex-row items-center">
              {selectedTags.length > 0 && (
                <View className="bg-primary rounded-full w-5 h-5 items-center justify-center mr-2">
                  <Text className="text-primary-foreground text-xs font-bold">
                    {selectedTags.length}
                  </Text>
                </View>
              )}
              <Ionicons name="chevron-down" size={16} color="#6B7280" />
            </View>
          </TouchableOpacity>

          {/* Count Selection Button */}
          <TouchableOpacity
            onPress={() => setShowCountModal(true)}
            disabled={dueCardCount === 0}
            className={`flex-1 border border-border rounded-xl p-4 flex-row items-center justify-between shadow-sm ${
              dueCardCount === 0 ? "bg-muted" : "bg-white"
            }`}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <Ionicons name="list-outline" size={20} color="#6B7280" />
              <Text
                className={`font-medium ml-2 ${
                  dueCardCount === 0
                    ? "text-muted-foreground"
                    : "text-foreground"
                }`}
              >
                {selectedCount > 0 ? `${selectedCount} cards` : "How many?"}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Selected Tags Display */}
        {selectedTags.length > 0 && (
          <View className="mb-6">
            <Text className="text-sm font-medium text-foreground mb-3">
              Selected Tags:
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {selectedTags.map((tagId) => {
                const tag = tags?.find((t: Tag) => t.id === tagId);
                return tag ? (
                  <View
                    key={tagId}
                    className="bg-secondary rounded-full px-3 py-1 flex-row items-center"
                  >
                    <Text className="text-secondary-foreground text-sm mr-2">
                      {tag.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleTagToggle(tagId)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close" size={14} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                ) : null;
              })}
            </View>
          </View>
        )}

        {/* Due Cards Info */}
        <View className="bg-white rounded-xl p-6 border border-border shadow-sm mb-6">
          <Text className="text-xl font-semibold text-foreground mb-2">
            Cards Due
          </Text>
          <Text className="text-3xl font-bold text-primary mb-2">
            {dueCardCount}
          </Text>
          <Text className="text-sm text-muted-foreground">
            Selected: {selectedCount} cards
          </Text>
        </View>

        {/* Error Display */}
        {(dueError || cardsError) && (
          <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <View className="flex-row items-center mb-2">
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
              <Text className="text-red-800 font-medium ml-2">Error</Text>
            </View>
            <Text className="text-red-700 text-sm">
              {dueError?.message ||
                cardsError?.message ||
                "Something went wrong"}
            </Text>
          </View>
        )}

        {/* Spacer */}
        <View className="flex-1" />

        {/* Review Button */}
        <TouchableOpacity
          className={`rounded-xl py-4 px-6 items-center shadow-sm ${
            dueCardCount === 0 || cardsLoading ? "bg-muted" : "bg-primary"
          }`}
          onPress={handleReview}
          disabled={dueCardCount === 0 || cardsLoading}
          activeOpacity={0.8}
        >
          {cardsLoading ? (
            <View className="flex-row items-center">
              <ActivityIndicator size="small" color="#6B7280" />
              <Text className="text-muted-foreground font-medium ml-2">
                Loading cards...
              </Text>
            </View>
          ) : (
            <Text
              className={`text-lg font-medium ${
                dueCardCount === 0
                  ? "text-muted-foreground"
                  : "text-primary-foreground"
              }`}
            >
              {dueCardCount === 0 ? "No Cards Due" : "Start Review"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Tag Selection Modal */}
      <Modal
        visible={showTagModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-background" style={{ paddingTop: top }}>
          {/* Modal Header */}
          <View className="flex-row items-center justify-between p-4 border-b border-border">
            <Text className="text-lg font-semibold text-foreground">
              Filter by Tags
            </Text>
            <TouchableOpacity
              onPress={() => setShowTagModal(false)}
              className="p-2"
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color="#18181b" />
            </TouchableOpacity>
          </View>

          {/* Tag List */}
          <ScrollView className="flex-1 p-4">
            {tags?.map((tag: Tag) => (
              <TouchableOpacity
                key={tag.id}
                onPress={() => handleTagToggle(tag.id)}
                className="flex-row items-center justify-between py-3 border-b border-border"
                activeOpacity={0.7}
              >
                <Text className="text-foreground text-base">{tag.name}</Text>
                {selectedTags.includes(tag.id) && (
                  <Ionicons name="checkmark" size={20} color="#18181b" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Count Selection Modal */}
      <Modal
        visible={showCountModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-background" style={{ paddingTop: top }}>
          {/* Modal Header */}
          <View className="flex-row items-center justify-between p-4 border-b border-border">
            <Text className="text-lg font-semibold text-foreground">
              Select Card Count
            </Text>
            <TouchableOpacity
              onPress={() => setShowCountModal(false)}
              className="p-2"
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color="#18181b" />
            </TouchableOpacity>
          </View>

          {/* Count Options */}
          <ScrollView className="flex-1 p-4">
            {countOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => handleCountSelection(option.value)}
                className="flex-row items-center justify-between py-4 border-b border-border"
                activeOpacity={0.7}
              >
                <Text className="text-foreground text-base font-medium">
                  {option.label}
                </Text>
                <Text className="text-muted-foreground">
                  {option.count} cards
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
