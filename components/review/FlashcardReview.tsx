// components/review/FlashcardReview.tsx
import { Ionicons } from "@expo/vector-icons";
import * as Sentry from "@sentry/react-native";
import { Image } from "expo-image";
import React, { useState } from "react";
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
import {
  CardUpdate,
  FlashCard,
  useDeleteFlashcard,
  useProcessFlashcards,
} from "../../hooks/review/useFlashcards";

interface FlashcardReviewProps {
  cards: FlashCard[];
  onComplete: () => void;
}

export default function FlashcardReview({
  cards,
  onComplete,
}: FlashcardReviewProps) {
  const { top, bottom } = useSafeAreaInsets();

  // Review state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState<CardUpdate[]>([]);

  // Modal states
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Mutations
  const processFlashcardsMutation = useProcessFlashcards();
  const deleteFlashcardMutation = useDeleteFlashcard();

  const currentCard = cards[currentCardIndex];
  const isLastCard = currentCardIndex === cards.length - 1;
  const progress = ((currentCardIndex + 1) / cards.length) * 100;

  // SRS Algorithm Constants
  const TWO_WEEKS = 1000 * 60 * 60 * 24 * 14; // 14 days in milliseconds
  const ONE_AND_HALF_MONTHS = 1000 * 60 * 60 * 24 * 45; // ~45 days in milliseconds

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleCardAction = async (action: "wrong" | "correct" | "skip") => {
    if (!currentCard) return;

    try {
      const now = new Date();

      // Handle last_reviewed - it might be a string or Date
      let lastReviewed = null;
      if (currentCard.last_reviewed) {
        try {
          // If it's already a Date object, use it. If it's a string, parse it.
          lastReviewed =
            typeof currentCard.last_reviewed === "string"
              ? new Date(currentCard.last_reviewed)
              : currentCard.last_reviewed;
        } catch (dateError) {
          console.warn(
            "⚠️ Invalid last_reviewed date:",
            currentCard.last_reviewed
          );
          lastReviewed = null;
        }
      }

      const timeSinceLastReview = lastReviewed
        ? now.getTime() - lastReviewed.getTime()
        : null;

      // Handle next_review - it might be a string, Date, or null
      let currentNextReview = null;
      if (currentCard.next_review) {
        try {
          // If it's a string, use it directly. If it's a Date, convert to string.
          currentNextReview =
            typeof currentCard.next_review === "string"
              ? currentCard.next_review
              : currentCard.next_review.toISOString();
        } catch (dateError) {
          console.warn("⚠️ Invalid next_review date:", currentCard.next_review);
          currentNextReview = null;
        }
      }

      // Prepare the update with safer handling
      let updateData: CardUpdate = {
        id: currentCard.id,
        status: "active", // Safe default
        next_review: currentNextReview, // Use the safely parsed value
        last_reviewed: now.toISOString(),
      };

      // Apply SRS algorithm
      switch (action) {
        case "wrong":
        case "skip":
          updateData.status = "active";
          updateData.next_review = new Date(
            now.getTime() + TWO_WEEKS
          ).toISOString();
          break;

        case "correct":
          if (
            timeSinceLastReview &&
            timeSinceLastReview > ONE_AND_HALF_MONTHS
          ) {
            updateData.status = "mastered";
            updateData.next_review = null; // Mastered cards don't need next review
          } else {
            updateData.status = "active";
            const nextReviewInterval =
              timeSinceLastReview && timeSinceLastReview < TWO_WEEKS
                ? TWO_WEEKS
                : ONE_AND_HALF_MONTHS;
            updateData.next_review = new Date(
              now.getTime() + nextReviewInterval
            ).toISOString();
          }
          break;
      }

      const allUpdates = [...(pendingUpdates || []), updateData];

      setPendingUpdates(allUpdates);

      if (isLastCard) {
        const result = await processFlashcardsMutation.mutateAsync(allUpdates);

        Alert.alert(
          "Review Complete",
          "Great job! Your progress has been saved.",
          [{ text: "OK", onPress: onComplete }]
        );
      } else {
        setCurrentCardIndex((prev) => prev + 1);
        setShowAnswer(false);
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          component: "FlashcardReview",
          action: "card_action",
        },
        extra: {
          action,
          cardId: currentCard.id,
          currentCardIndex,
          isLastCard,
          pendingUpdatesCount: pendingUpdates.length,
          cardData: {
            next_review: currentCard?.next_review,
            last_reviewed: currentCard?.last_reviewed,
            status: currentCard?.status,
          },
        },
      });

      Alert.alert(
        "Error",
        `Failed to process card: ${error || "Unknown error"}`
      );
    }
  };

  const handleSuspendCard = async () => {
    if (!currentCard) return;

    try {
      const now = new Date();
      const updateData: CardUpdate = {
        id: currentCard.id,
        status: "suspended",
        next_review: null,
        last_reviewed: now.toISOString(),
      };

      setPendingUpdates((prev) => [...prev, updateData]);
      setShowOptionsModal(false);

      if (isLastCard) {
        const allUpdates = [...pendingUpdates, updateData];
        await processFlashcardsMutation.mutateAsync(allUpdates);
        Alert.alert("Review Complete", "Card suspended and progress saved.", [
          { text: "OK", onPress: onComplete },
        ]);
      } else {
        setCurrentCardIndex((prev) => prev + 1);
        setShowAnswer(false);
      }

      Alert.alert(
        "Card Suspended",
        "This card won't appear in future reviews until reactivated."
      );
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          component: "FlashcardReview",
          action: "suspend_card",
        },
      });
      Alert.alert("Error", "Failed to suspend card. Please try again.");
    }
  };

  const handleDeleteCard = async () => {
    if (!currentCard) return;

    try {
      await deleteFlashcardMutation.mutateAsync(currentCard.id);
      setShowDeleteConfirm(false);
      setShowOptionsModal(false);

      if (isLastCard) {
        // If this was the last card, process any pending updates and complete
        if (pendingUpdates.length > 0) {
          await processFlashcardsMutation.mutateAsync(pendingUpdates);
        }
        Alert.alert("Review Complete", "Card deleted and progress saved.", [
          { text: "OK", onPress: onComplete },
        ]);
      } else {
        // Remove the deleted card from our local array and continue
        const remainingCards = cards.filter(
          (card) => card.id !== currentCard.id
        );
        if (currentCardIndex >= remainingCards.length) {
          setCurrentCardIndex(remainingCards.length - 1);
        }
        setShowAnswer(false);
      }

      Alert.alert("Success", "Card deleted successfully.");
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          component: "FlashcardReview",
          action: "delete_card",
        },
      });
      Alert.alert("Error", "Failed to delete card. Please try again.");
    }
  };

  const renderCardContent = () => {
    if (!currentCard) return null;

    if (currentCard.card_type === "qa") {
      return (
        <View className="flex-1">
          <View className="mb-6">
            <Text className="text-xl font-semibold text-foreground">
              {currentCard.question}
            </Text>
          </View>

          {showAnswer && (
            <View className="mt-4 rounded-xl bg-muted p-4">
              <Text className="text-lg text-foreground">
                {currentCard.answer}
              </Text>
            </View>
          )}
        </View>
      );
    } else if (currentCard.card_type === "cloze") {
      return (
        <View className="flex-1">
          {!showAnswer ? (
            <Text className="text-lg text-foreground">
              {currentCard.cloze_template}
            </Text>
          ) : (
            <View>
              <Text className="text-lg text-foreground mb-4">
                {currentCard.cloze_template}
              </Text>
              <View className="rounded-xl bg-muted p-4">
                <Text className="font-medium text-foreground">
                  Answer: {currentCard.cloze_answers}
                </Text>
              </View>
            </View>
          )}
        </View>
      );
    } else if (currentCard.card_type === "image" || currentCard.image_cid) {
      return (
        <View className="flex-1 items-center">
          <View className="mb-4 w-full max-h-80 items-center justify-center">
            <Image
              source={{
                uri: `https://idealite.xyz/${currentCard.image_cid}`,
              }}
              style={{
                width: "100%",
                height: 300,
                borderRadius: 12,
              }}
              contentFit="contain"
            />
          </View>

          {showAnswer && currentCard.description && (
            <View className="mt-4 w-full rounded-xl bg-muted p-4">
              <Text className="text-lg text-foreground">
                {currentCard.description}
              </Text>
            </View>
          )}
        </View>
      );
    } else if (currentCard.content) {
      // Fallback for content-only cards
      return (
        <View className="flex-1">
          {!showAnswer ? (
            <Text className="text-foreground" numberOfLines={3}>
              {currentCard.content.substring(0, 100)}...
            </Text>
          ) : (
            <View className="mt-4 rounded-xl bg-muted p-4">
              <Text className="text-lg text-foreground">
                {currentCard.content}
              </Text>
            </View>
          )}
        </View>
      );
    }

    // Final fallback
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-muted-foreground text-center">
          This card has no content to display.
        </Text>
      </View>
    );
  };

  if (!currentCard) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-foreground text-lg">No cards to review</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-border">
        <View className="flex-1">
          <Text className="text-sm text-muted-foreground">
            Card {currentCardIndex + 1} of {cards.length}
          </Text>
          <View className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <View
              className="h-full bg-primary rounded-full"
              style={{ width: `${progress}%` }}
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setShowOptionsModal(true)}
          className="p-2 ml-4"
          activeOpacity={0.7}
          disabled={
            processFlashcardsMutation.isPending ||
            deleteFlashcardMutation.isPending
          }
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Card Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          padding: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-white rounded-xl p-6 border border-border shadow-sm min-h-64">
          {renderCardContent()}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View className="p-4" style={{ paddingBottom: bottom + 16 }}>
        {!showAnswer ? (
          <TouchableOpacity
            className="bg-primary rounded-xl py-4 items-center"
            onPress={handleShowAnswer}
            activeOpacity={0.8}
          >
            <Text className="text-primary-foreground text-lg font-medium">
              Show Answer
            </Text>
          </TouchableOpacity>
        ) : (
          <View className="flex-row gap-3">
            {/* Wrong */}
            <TouchableOpacity
              className="flex-1 bg-white border border-red-500 rounded-xl py-4 items-center"
              onPress={() => handleCardAction("wrong")}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={20} color="#EF4444" />
              <Text className="text-red-500 font-medium mt-1">Wrong</Text>
            </TouchableOpacity>

            {/* Skip */}
            <TouchableOpacity
              className="flex-1 bg-white border border-border rounded-xl py-4 items-center"
              onPress={() => handleCardAction("skip")}
              activeOpacity={0.8}
            >
              <Ionicons name="play-forward" size={20} color="#6B7280" />
              <Text className="text-foreground font-medium mt-1">Skip</Text>
            </TouchableOpacity>

            {/* Correct */}
            <TouchableOpacity
              className="flex-1 bg-white border border-green-500 rounded-xl py-4 items-center"
              onPress={() => handleCardAction("correct")}
              disabled={processFlashcardsMutation.isPending}
              activeOpacity={0.8}
            >
              {processFlashcardsMutation.isPending ? (
                <ActivityIndicator size="small" color="#10B981" />
              ) : (
                <Ionicons name="checkmark" size={20} color="#10B981" />
              )}
              <Text className="text-green-500 font-medium mt-1">Correct</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Options Modal */}
      <Modal
        visible={showOptionsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <View className="flex-1 bg-background" style={{ paddingTop: top }}>
          <View className="flex-row items-center justify-between p-4 border-b border-border">
            <Text className="text-lg font-semibold text-foreground">
              Card Options
            </Text>
            <TouchableOpacity
              onPress={() => setShowOptionsModal(false)}
              className="p-2"
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color="#18181b" />
            </TouchableOpacity>
          </View>

          <View className="p-4">
            <TouchableOpacity
              onPress={handleSuspendCard}
              className="flex-row items-center py-4 border-b border-border"
              activeOpacity={0.7}
            >
              <Ionicons name="pause-circle-outline" size={24} color="#6B7280" />
              <View className="ml-4">
                <Text className="text-foreground font-medium">
                  Suspend Card
                </Text>
                <Text className="text-muted-foreground text-sm">
                  Hide this card from future reviews
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowDeleteConfirm(true)}
              className="flex-row items-center py-4"
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={24} color="#EF4444" />
              <View className="ml-4">
                <Text className="text-red-500 font-medium">Delete Card</Text>
                <Text className="text-muted-foreground text-sm">
                  Permanently remove this card
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        animationType="fade"
        transparent
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View className="flex-1 bg-black bg-opacity-50 items-center justify-center p-4">
          <View className="bg-white rounded-xl p-6 w-full max-w-sm">
            <Text className="text-lg font-semibold text-foreground mb-2">
              Delete Card
            </Text>
            <Text className="text-muted-foreground mb-6">
              Are you sure you want to delete this flashcard? This action cannot
              be undone.
            </Text>

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-muted rounded-xl py-3 items-center"
                onPress={() => setShowDeleteConfirm(false)}
                activeOpacity={0.8}
              >
                <Text className="text-foreground font-medium">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 bg-red-500 rounded-xl py-3 items-center"
                onPress={handleDeleteCard}
                disabled={deleteFlashcardMutation.isPending}
                activeOpacity={0.8}
              >
                {deleteFlashcardMutation.isPending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-medium">Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
