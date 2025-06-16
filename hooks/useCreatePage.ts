// hooks/useCreatePage.ts
import * as Sentry from "@sentry/react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../lib/api/client";

interface CreatePageRequest {
  title: string;
  tagId: string;
  hierarchy: string[];
  folderId?: string | null;
  type: "page" | "canvas";
}

export const useCreatePage = () => {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreatePageRequest) => {
      return apiClient.post("/api/v1/tags/create-page", request);
    },
    onSuccess: () => {
      // Invalidate tag tree to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["tagTree"] });
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          component: "useCreatePage",
          action: "create_page",
        },
      });
    },
  });
};
