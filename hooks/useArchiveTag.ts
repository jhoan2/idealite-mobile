// hooks/useArchiveTag.ts
import * as Sentry from "@sentry/react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../lib/api/client";

interface ArchiveTagRequest {
  tagId: string;
  isArchived?: boolean;
}

interface ArchiveTagResponse {
  success: boolean;
  message?: string;
}

export const useArchiveTag = () => {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation<ArchiveTagResponse, Error, ArchiveTagRequest>({
    mutationFn: async ({ tagId, isArchived = true }) => {
      return await apiClient.post("/api/v1/tags/archive", {
        tagId,
        isArchived,
      });
    },
    onSuccess: (data, variables) => {
      // Invalidate tag tree query to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["tagTree"] });

      Sentry.addBreadcrumb({
        message: `Tag ${variables.isArchived ? "archived" : "unarchived"}`,
        category: "action",
        data: {
          tagId: variables.tagId,
          isArchived: variables.isArchived,
        },
      });
    },
    onError: (error, variables) => {
      Sentry.captureException(error, {
        tags: {
          component: "useArchiveTag",
          action: "archive_tag",
        },
        extra: {
          tagId: variables.tagId,
          isArchived: variables.isArchived,
        },
      });
    },
  });
};
