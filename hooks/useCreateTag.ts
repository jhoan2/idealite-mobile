// hooks/useCreateTag.ts
import * as Sentry from "@sentry/react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../lib/api/client";

interface CreateTagRequest {
  name: string;
  parentId: string;
}

export const useCreateTag = () => {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateTagRequest) => {
      return apiClient.post("/api/v1/tags/create-tag", request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tagTree"] });
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          component: "useCreateTag",
          action: "create_tag",
        },
      });
    },
  });
};
