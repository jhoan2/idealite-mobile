// hooks/useDeleteFolder.ts
import * as Sentry from "@sentry/react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../lib/api/client";

interface DeleteFolderRequest {
  id: string;
}

export const useDeleteFolder = () => {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: DeleteFolderRequest) => {
      return apiClient.delete("/api/v1/folders/delete", request);
    },
    onSuccess: () => {
      // Invalidate tag tree to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["tagTree"] });
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          component: "useDeleteFolder",
          action: "delete_folder",
        },
      });
    },
  });
};
