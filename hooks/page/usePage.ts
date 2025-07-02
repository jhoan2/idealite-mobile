// hooks/page/usePage.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../../lib/api/client";
import { TreeTag } from "../../lib/api/tagTree";

// Enhanced types for the page data
export interface Tag {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: Date;
  updated_at: Date | null;
  deleted: boolean | null;
  is_template: boolean;
}

export interface Resource {
  id: string;
  title: string;
  url: string;
  description: string | null;
  author: string | null;
  date_published: Date | null;
  image: string | null;
  type: string;
  og_type: string | null;
  created_at: Date;
  updated_at: Date | null;
}

// ADDED_START
// Flashcard interface matching the database schema
export interface Flashcard {
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
  last_reviewed: string | null;
  next_review: string | null;
  mastered_at: string | null;
  status: "active" | "mastered" | "suspended";
  created_at: string;
  updated_at: string | null;
  deleted: boolean | null;
  source_locator: any; // JSON field as returned by the API
}
// ADDED_END

// Enhanced PageData interface
interface PageData {
  // Basic page data
  id: string;
  title: string;
  content: string | null;
  content_type: "page" | "canvas";
  canvas_image_cid: string | null;
  created_at: string;
  updated_at: string | null;

  // Enhanced data
  tags: Tag[];
  resources: Resource[];
  flashcards: Flashcard[];
  userTagTree: TreeTag[];
}

interface UpdatePageData {
  title?: string;
  content?: string;
}

export const usePage = (pageId: string) => {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  // Query to fetch enhanced page data
  const {
    data: page,
    isLoading,
    error,
    refetch,
  } = useQuery<PageData>({
    queryKey: ["page", pageId],
    queryFn: () => apiClient.get(`/api/v1/pages/${pageId}`),
    enabled: !!pageId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on authentication errors (401)
      if (error && "status" in error && error.status === 401) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Mutation to update page
  const updatePageMutation = useMutation<any, Error, UpdatePageData>({
    mutationFn: (data) => apiClient.put(`/api/v1/pages/${pageId}`, data),
    onSuccess: (updateResponse, variables) => {
      // MERGE the update with existing cache data instead of replacing
      queryClient.setQueryData(
        ["page", pageId],
        (oldData: PageData | undefined) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            // Update only the fields that were actually changed
            ...(variables.title !== undefined && { title: variables.title }),
            ...(variables.content !== undefined && {
              content: variables.content,
            }),
            // Always update the timestamp from server response
            updated_at: updateResponse.updated_at || oldData.updated_at,
            // Preserve enhanced data (tags, resources, userTagTree remain unchanged)
            tags: oldData.tags,
            resources: oldData.resources,
            flashcards: oldData.flashcards,
            userTagTree: oldData.userTagTree,
          };
        }
      );
    },
  });

  return {
    page,
    isLoading,
    error,
    refetch,
    updatePage: updatePageMutation.mutateAsync,
    isUpdating: updatePageMutation.isPending,
    updateError: updatePageMutation.error,
  };
};
