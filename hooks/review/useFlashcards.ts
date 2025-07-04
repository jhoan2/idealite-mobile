// hooks/review/useFlashcards.ts
import * as Sentry from "@sentry/react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../../lib/api/client";

// Types for flashcards (matching your web app)
export interface FlashCard {
  id: string;
  user_id: string;
  page_id: string | null;
  resource_id: string | null;
  card_type: "qa" | "image" | "cloze" | null;
  question: string | null;
  answer: string | null;
  cloze_template: string | null;
  cloze_answers: string | null;
  content: string | null;
  image_cid: string | null;
  description: string | null;
  last_reviewed: Date | null;
  next_review: Date | null;
  mastered_at: Date | null;
  status: "active" | "mastered" | "suspended";
  created_at: Date;
  updated_at: Date | null;
  deleted: boolean;
  source_locator: Record<string, any>;
  tags: Array<{
    id: string;
    name: string;
    parent_id: string | null;
    created_at: Date;
    updated_at: Date | null;
    deleted: boolean | null;
    is_template: boolean | null;
    embedding?: number[];
  }>;
}

export interface CardUpdate {
  id: string;
  status: "active" | "mastered" | "suspended";
  next_review: string | null;
  last_reviewed: string;
}

export interface GetDueCardsParams {
  status?: "active" | "mastered" | "suspended" | "all";
  tags?: string[];
  limit?: number;
  getCards?: boolean;
}

export interface DueCardsResponse {
  count: number;
  cards?: FlashCard[];
}

// Hook to get due flashcards
export const useDueFlashcards = (params: GetDueCardsParams = {}) => {
  const apiClient = useApiClient();

  return useQuery<DueCardsResponse>({
    queryKey: ["dueFlashcards", params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();

      if (params.status) queryParams.append("status", params.status);
      if (params.tags?.length) {
        params.tags.forEach((tag) => queryParams.append("tags", tag));
      }
      if (params.limit) queryParams.append("limit", params.limit.toString());
      if (params.getCards) queryParams.append("getCards", "true");

      return apiClient.get(`/api/v1/cards/due?${queryParams.toString()}`);
    },
    staleTime: 30 * 1000, // 30 seconds
    retry: (failureCount, error) => {
      if (error && "status" in error && error.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

// Hook to process flashcards (batch update after review session)
export const useProcessFlashcards = () => {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation<any, Error, CardUpdate[]>({
    mutationFn: async (updates: CardUpdate[]) => {
      return apiClient.post("/api/v1/cards/process", { updates });
    },
    onSuccess: () => {
      // Invalidate due cards query to refresh counts
      queryClient.invalidateQueries({ queryKey: ["dueFlashcards"] });
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          component: "useProcessFlashcards",
          action: "process_flashcards",
        },
      });
    },
  });
};

// Hook to delete a flashcard
export const useDeleteFlashcard = () => {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation<any, Error, string>({
    mutationFn: async (cardId: string) => {
      return apiClient.delete("/api/v1/cards/delete", { id: cardId });
    },
    onSuccess: () => {
      // Invalidate due cards query to refresh counts
      queryClient.invalidateQueries({ queryKey: ["dueFlashcards"] });
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          component: "useDeleteFlashcard",
          action: "delete_flashcard",
        },
      });
    },
  });
};

// Hook to get user tags for filtering
export const useUserTags = () => {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: ["userTags"],
    queryFn: async () => {
      // Use the tag tree API instead - it returns proper tag data with names
      const response = await apiClient.get("/api/v1/tags/tree");
      // Flatten the tree structure to get all tags
      const flattenTags = (tags: any[]): any[] => {
        let result: any[] = [];
        tags.forEach((tag) => {
          result.push({
            id: tag.id,
            name: tag.name,
            is_archived: tag.is_archived,
          });
          if (tag.children && tag.children.length > 0) {
            result = result.concat(flattenTags(tag.children));
          }
        });
        return result;
      };

      return flattenTags(response.data || []);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};
