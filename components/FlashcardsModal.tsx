import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import * as Sentry from "@sentry/react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Flashcard, usePage } from "../hooks/page/usePage";
import { useApiClient } from "../lib/api/client";

interface FlashcardsModalProps {
  visible: boolean;
  onClose: () => void;
  pageId: string | null;
}

const FlashcardItem: React.FC<{
  card: Flashcard;
  onDelete: (cardId: string) => void;
  isDeleting: boolean;
}> = ({ card, onDelete, isDeleting }) => {
  const getCardTypeIcon = () => {
    switch (card.card_type) {
      case "qa":
        return "help-circle-outline";
      case "cloze":
        return "ellipsis-horizontal-outline";
      case "image":
        return "image-outline";
      default:
        return "card-outline";
    }
  };

  const getStatusColor = () => {
    switch (card.status) {
      case "active":
        return "text-blue-600";
      case "mastered":
        return "text-green-600";
      case "suspended":
        return "text-gray-500";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = () => {
    switch (card.status) {
      case "active":
        return "radio-button-off-outline";
      case "mastered":
        return "checkmark-circle-outline";
      case "suspended":
        return "pause-circle-outline";
      default:
        return "radio-button-off-outline";
    }
  };

  return (
    <View className="bg-white rounded-xl p-4 mb-3 border border-gray-200 shadow-sm">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Ionicons name={getCardTypeIcon() as any} size={20} color="#6B7280" />
          <Text className="ml-2 text-sm font-medium text-gray-700 capitalize">
            {card.card_type}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons
            name={getStatusIcon() as any}
            size={16}
            color={
              card.status === "active"
                ? "#3B82F6"
                : card.status === "mastered"
                ? "#10B981"
                : "#6B7280"
            }
            style={{ marginRight: 6 }}
          />
          <View className={`px-2 py-1 rounded-full bg-gray-100 mr-2`}>
            <Text
              className={`text-xs font-medium capitalize ${getStatusColor()}`}
            >
              {card.status}
            </Text>
          </View>
          {/* Delete button */}
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                "Delete Card",
                "Are you sure you want to delete this flashcard?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => onDelete(card.id),
                  },
                ]
              );
            }}
            disabled={isDeleting}
            className="p-1 rounded-full"
            activeOpacity={0.7}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {card.image_cid ? (
        // Image card display
        <View className="space-y-2">
          <Image
            source={{ uri: `https://idealite.xyz/${card.image_cid}` }}
            className="w-full h-48 rounded-lg"
            resizeMode="cover"
          />
          {card.description && (
            <View>
              <Text className="text-xs font-medium text-gray-500 mb-1">
                Description
              </Text>
              <Text className="text-gray-700">{card.description}</Text>
            </View>
          )}
        </View>
      ) : card.card_type === "qa" ? (
        // Q&A card display
        <View>
          {card.question && (
            <View className="mb-2">
              <Text className="text-xs font-medium text-gray-500 mb-1">
                Question
              </Text>
              <Text className="text-gray-900">{card.question}</Text>
            </View>
          )}
          {card.answer && (
            <View>
              <Text className="text-xs font-medium text-gray-500 mb-1">
                Answer
              </Text>
              <Text className="text-gray-700">{card.answer}</Text>
            </View>
          )}
        </View>
      ) : card.card_type === "cloze" ? (
        // Cloze card display
        <View>
          {card.cloze_template && (
            <View className="mb-2">
              <Text className="text-xs font-medium text-gray-500 mb-1">
                Template
              </Text>
              <Text className="text-gray-900">{card.cloze_template}</Text>
            </View>
          )}
          {card.cloze_answers && (
            <View>
              <Text className="text-xs font-medium text-gray-500 mb-1">
                Answers
              </Text>
              <Text className="text-gray-700">{card.cloze_answers}</Text>
            </View>
          )}
        </View>
      ) : (
        // Default content display
        card.content && (
          <View>
            <Text className="text-xs font-medium text-gray-500 mb-1">
              Content
            </Text>
            <Text className="text-gray-700 text-sm" numberOfLines={3}>
              {card.content}
            </Text>
          </View>
        )
      )}

      {/* Footer with timestamps */}
      <View className="mt-3 pt-3 border-t border-gray-100">
        <Text className="text-xs text-gray-500">
          Created: {new Date(card.created_at).toLocaleDateString()}
          {card.last_reviewed && (
            <>
              {" • "}
              Last reviewed: {new Date(card.last_reviewed).toLocaleDateString()}
            </>
          )}
          {card.next_review && (
            <>
              {" • "}
              Next review: {new Date(card.next_review).toLocaleDateString()}
            </>
          )}
        </Text>
      </View>
    </View>
  );
};

export function FlashcardsModal({
  visible,
  onClose,
  pageId,
}: FlashcardsModalProps) {
  const sheetRef = useRef<BottomSheet>(null);
  const { bottom } = useSafeAreaInsets();
  const snapPoints = useMemo(() => ["50%", "75%", "95%"], []);
  const apiClient = useApiClient();

  // State for tracking deletions
  const [deletingCards, setDeletingCards] = useState<Set<string>>(new Set());

  const { page, isLoading, error, refetch } = usePage(pageId || "");

  const flashcards = page?.flashcards || [];

  // Open/close modal
  useEffect(() => {
    if (visible) {
      sheetRef.current?.snapToIndex(0);
    } else {
      sheetRef.current?.close();
      // Clear deleting state when modal closes
      setDeletingCards(new Set());
    }
  }, [visible]);

  const handleClose = () => {
    onClose();
  };

  // Delete handler
  const handleDeleteCard = async (cardId: string) => {
    try {
      // Add to deleting set
      setDeletingCards((prev) => new Set(prev).add(cardId));

      // Call delete API with your pattern
      await apiClient.delete("/api/v1/cards/delete", { id: cardId });

      // Refresh the page data to update the flashcards list
      await refetch();

      // Show success message
      Alert.alert("Success", "Card deleted successfully");
    } catch (error) {
      console.error("Error deleting card:", error);

      Sentry.captureException(error, {
        tags: {
          component: "FlashcardsModal",
          action: "delete_card",
        },
        extra: {
          cardId,
          pageId,
        },
      });

      Alert.alert("Error", "Failed to delete card. Please try again.");
    } finally {
      // Remove from deleting set
      setDeletingCards((prev) => {
        const next = new Set(prev);
        next.delete(cardId);
        return next;
      });
    }
  };

  // Filter cards by status for quick stats (exclude deleted cards)
  const cardStats = useMemo(() => {
    const activeCards = flashcards.filter((card) => !card.deleted);
    const active = activeCards.filter(
      (card) => card.status === "active"
    ).length;
    const mastered = activeCards.filter(
      (card) => card.status === "mastered"
    ).length;
    const suspended = activeCards.filter(
      (card) => card.status === "suspended"
    ).length;

    return { active, mastered, suspended, total: activeCards.length };
  }, [flashcards]);

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={handleClose}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
        />
      )}
      backgroundStyle={{
        backgroundColor: "#F9FAFB",
      }}
      handleIndicatorStyle={{
        backgroundColor: "#D1D5DB",
        width: 40,
      }}
    >
      <BottomSheetScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: bottom + 20,
        }}
        showsVerticalScrollIndicator
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200 bg-white">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-900">
              Flashcards
            </Text>
            <View className="flex-row items-center mt-1">
              <Text className="text-sm text-gray-600 mr-4">
                {cardStats.total} total
              </Text>
              {cardStats.total > 0 && (
                <View className="flex-row items-center space-x-3">
                  <View className="flex-row items-center">
                    <View className="w-2 h-2 bg-blue-500 rounded-full mr-1" />
                    <Text className="text-xs text-gray-600">
                      {cardStats.active} active
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <View className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                    <Text className="text-xs text-gray-600">
                      {cardStats.mastered} mastered
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <View className="w-2 h-2 bg-gray-500 rounded-full mr-1" />
                    <Text className="text-xs text-gray-600">
                      {cardStats.suspended} suspended
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity
            onPress={handleClose}
            className="p-2 rounded-full bg-gray-100"
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View className="flex-1 px-4 py-4">
          {isLoading ? (
            <View className="flex-1 items-center justify-center py-12">
              <ActivityIndicator size="large" color="#4B5563" />
              <Text className="text-gray-600 mt-4">Loading flashcards...</Text>
            </View>
          ) : error ? (
            <View className="flex-1 items-center justify-center py-12">
              <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
              <Text className="text-red-600 text-center font-semibold mt-4">
                Failed to load flashcards
              </Text>
              <Text className="text-gray-600 text-center mt-2">
                {error?.message || "An unexpected error occurred"}
              </Text>
              <TouchableOpacity
                onPress={() => refetch()}
                className="mt-4 bg-blue-500 px-6 py-2 rounded-lg"
              >
                <Text className="text-white font-medium">Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : cardStats.total === 0 ? (
            <View className="flex-1 items-center justify-center py-12">
              <Ionicons name="library-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-600 text-center font-semibold mt-4">
                No flashcards found
              </Text>
              <Text className="text-gray-500 text-center mt-2">
                Create flashcards from your page content to see them here
              </Text>
            </View>
          ) : (
            // Flashcards list
            <View>
              {flashcards
                .filter((card) => !card.deleted)
                .map((card) => (
                  <FlashcardItem
                    key={card.id}
                    card={card}
                    onDelete={handleDeleteCard}
                    isDeleting={deletingCards.has(card.id)}
                  />
                ))}
            </View>
          )}
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}
