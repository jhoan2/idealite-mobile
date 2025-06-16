// hooks/useDeletePage.ts
import * as Sentry from "@sentry/react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../lib/api/client";

interface DeletePageRequest {
  id: string;
  title?: string;
}

export const useDeletePage = () => {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: DeletePageRequest) => {
      return apiClient.delete("/api/v1/pages/delete", request);
    },
    onSuccess: () => {
      // Invalidate tag tree to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["tagTree"] });
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          component: "useDeletePage",
          action: "delete_page",
        },
      });
    },
  });
};
