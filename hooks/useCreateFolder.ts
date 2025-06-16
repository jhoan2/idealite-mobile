// hooks/useCreateFolder.ts
import * as Sentry from "@sentry/react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../lib/api/client";

interface CreateFolderRequest {
  name?: string;
  tagId: string;
  parentFolderId?: string;
}

export const useCreateFolder = () => {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateFolderRequest) => {
      return apiClient.post("/api/v1/tags/create-folder", request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tagTree"] });
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          component: "useCreateFolder",
          action: "create_folder",
        },
      });
    },
  });
};
