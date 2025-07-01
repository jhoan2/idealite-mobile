import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import React, { useEffect, useMemo, useRef } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Flashcard, usePage } from "../hooks/page/usePage";

interface FlashcardsModalProps {
  visible: boolean;
  onClose: () => void;
  pageId: string | null;
}

const FlashcardItem: React.FC<{ card: Flashcard }> = ({ card }) => {
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
          <View className={`px-2 py-1 rounded-full bg-gray-100`}>
            <Text
              className={`text-xs font-medium capitalize ${getStatusColor()}`}
            >
              {card.status}
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      {card.card_type === "qa" && (
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
      )}

      {card.card_type === "cloze" && (
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
      )}

      {card.content && (
        <View className="mt-2">
          <Text className="text-xs font-medium text-gray-500 mb-1">
            Content
          </Text>
          <Text className="text-gray-700 text-sm" numberOfLines={3}>
            {card.content}
          </Text>
        </View>
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

  const { page, isLoading, error, refetch } = usePage(pageId || "");

  const flashcards = page?.flashcards || [];

  // Open/close modal
  useEffect(() => {
    if (visible) {
      sheetRef.current?.snapToIndex(0);
    } else {
      sheetRef.current?.close();
    }
  }, [visible]);

  const handleClose = () => {
    onClose();
  };

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
            <Text className="text-sm text-gray-600 mt-1">
              {flashcards.length} card{flashcards.length !== 1 ? "s" : ""} found
            </Text>
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
          ) : flashcards.length === 0 ? (
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
              {flashcards.map((card) => (
                <FlashcardItem key={card.id} card={card} />
              ))}
            </View>
          )}
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}
