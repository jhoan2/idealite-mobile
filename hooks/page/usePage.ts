// hooks/page/usePage.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../../lib/api/client";

interface PageData {
  id: string;
  title: string;
  content: string | null;
  content_type: "page" | "canvas";
  created_at: string;
  updated_at: string | null;
}

interface UpdatePageData {
  title?: string;
  content?: string;
}

export const usePage = (pageId: string) => {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  // Query to fetch page data
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
