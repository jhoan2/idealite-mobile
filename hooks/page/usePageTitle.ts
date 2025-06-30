// hooks/page/usePageTitle.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../../lib/api/client";

interface PageTitleData {
  id: string;
  title: string;
}

export function usePageTitle(pageId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  // Fetch just the title data
  const {
    data: page,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["pageTitle", pageId],
    queryFn: async (): Promise<PageTitleData> => {
      const response = await api.get(`/api/v1/pages/${pageId}/title`);
      return response;
    },
    enabled: !!pageId,
  });

  // Update title mutation
  const updateTitleMutation = useMutation({
    mutationFn: async ({ title }: { title: string }) => {
      const response = await api.patch(`/api/v1/pages/${pageId}/title`, {
        title,
      });
      return response;
    },
    onSuccess: (data) => {
      // Update the query cache
      queryClient.setQueryData(["pageTitle", pageId], data);

      // Also invalidate any full page queries if they exist
      queryClient.invalidateQueries({ queryKey: ["page", pageId] });
    },
  });

  return {
    page,
    title: page?.title,
    isLoading,
    error,
    refetch,
    updateTitle: updateTitleMutation.mutateAsync,
    isUpdating: updateTitleMutation.isPending,
  };
}
