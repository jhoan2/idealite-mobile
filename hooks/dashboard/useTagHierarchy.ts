// hooks/dashboard/useTagHierarchy.ts
import { useAuth } from "@clerk/clerk-expo";
import * as Sentry from "@sentry/react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../../lib/api/client";

export type TagHierarchyNode = {
  id: string;
  name: string;
  parent?: string;
  children: string[];
  progress: number;
  description?: string;
  isPinned: boolean;
  cardCount: number;
};

export type TagHierarchyData = {
  [key: string]: TagHierarchyNode;
};

export function useTagHierarchy() {
  const { isSignedIn } = useAuth();
  const apiClient = useApiClient();

  return useQuery<TagHierarchyData>({
    queryKey: ["tagHierarchy"],
    queryFn: async () => {
      const response = await apiClient.get("/api/v1/tags/hierarchy-mobile");
      return response.data;
    },
    enabled: !!isSignedIn,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on authentication errors (401)
      if (error && "status" in error && error.status === 401) {
        return false;
      }

      // Retry up to 3 times for other network errors
      if (failureCount < 3) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    meta: {
      onError: (error: Error) => {
        Sentry.captureException(error, {
          tags: {
            component: "useTagHierarchy",
            action: "fetchTagHierarchy",
          },
        });
      },
    },
  });
}

export function useToggleTagPin() {
  const { isSignedIn } = useAuth();
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tagId,
      isPinned,
    }: {
      tagId: string;
      isPinned: boolean;
    }) => {
      return apiClient.post("/api/v1/tags/pin", { tagId, isPinned });
    },
    onSuccess: () => {
      // Invalidate and refetch tag hierarchy
      queryClient.invalidateQueries({ queryKey: ["tagHierarchy"] });
      // Also invalidate dashboard data since it might include pinned status
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: Error) => {
      Sentry.captureException(error, {
        tags: {
          component: "useToggleTagPin",
          action: "togglePin",
        },
      });
    },
  });
}
