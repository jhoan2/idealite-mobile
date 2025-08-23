// hooks/pages/usePinnedPages.ts
import { useAuth } from "@clerk/clerk-expo";
import * as Sentry from "@sentry/react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface PinnedPage {
  id: string;
  title: string;
  description?: string;
  updated_at: string;
  order_index: number;
}

interface PinnedPagesResponse {
  success: boolean;
  data: PinnedPage[];
}

// Fetch pinned pages
export function usePinnedPages() {
  const { getToken, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ["pinnedPages"],
    queryFn: async (): Promise<PinnedPage[]> => {
      if (!isSignedIn) {
        throw new Error("Not authenticated");
      }

      const token = await getToken();
      if (!token) {
        throw new Error("No authentication token");
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/v1/pages/pinned-pages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch pinned pages: ${errorText}`);
      }

      const data: PinnedPagesResponse = await response.json();

      if (!data.success) {
        throw new Error("Failed to fetch pinned pages");
      }

      // Sort by order_index to maintain the correct order
      return data.data.sort((a, b) => a.order_index - b.order_index);
    },
    enabled: isSignedIn,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
}

// Reorder pinned pages
export function useReorderPinnedPages() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pageIds: string[]) => {
      const token = await getToken();
      if (!token) {
        throw new Error("No authentication token");
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/v1/pages/pinned-pages/reorder`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ pageIds }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to reorder pages: ${errorText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch pinned pages
      queryClient.invalidateQueries({ queryKey: ["pinnedPages"] });
    },
    onError: (error) => {
      console.error("Error reordering pinned pages:", error);
      Sentry.captureException(error, {
        tags: {
          component: "useReorderPinnedPages",
          operation: "reorder",
        },
      });
    },
  });
}

// Pin a page
export function usePinPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pageId: string) => {
      const token = await getToken();
      if (!token) {
        throw new Error("No authentication token");
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/v1/pages/pinned-pages/pin`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ pageId }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to pin page: ${errorText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pinnedPages"] });
    },
    onError: (error) => {
      console.error("Error pinning page:", error);
      Sentry.captureException(error, {
        tags: {
          component: "usePinPage",
          operation: "pin",
        },
      });
    },
  });
}
