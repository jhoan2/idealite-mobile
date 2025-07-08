// hooks/folders/useRenameFolder.ts
import { useApiClient } from "@/lib/api/client";
import * as Sentry from "@sentry/react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface RenameFolderRequest {
  folderId: string;
  newName: string;
}

export const useRenameFolder = () => {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: RenameFolderRequest) => {
      return apiClient.post("/api/v1/folders/rename", request);
    },
    onSuccess: () => {
      // Invalidate tag tree to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["tagTree"] });
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          component: "useRenameFolder",
          action: "rename_folder",
        },
      });
    },
  });
};
