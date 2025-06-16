// hooks/useMovePage.ts
import * as Sentry from "@sentry/react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../lib/api/client";

interface MovePageRequest {
  pageId: string;
  destinationId: string; // "folder-uuid" or "tag-uuid"
}

export const useMovePage = () => {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: MovePageRequest) => {
      return apiClient.post("/api/v1/pages/move", request);
    },
    onSuccess: () => {
      // Invalidate tag tree to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["tagTree"] });
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          component: "useMovePage",
          action: "move_page",
        },
      });
    },
  });
};
