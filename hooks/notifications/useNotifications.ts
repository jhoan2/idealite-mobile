// hooks/notifications/useNotifications.ts
import { useAuth } from "@clerk/clerk-expo";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: string;
  event_type: string;
  status: "unread" | "read" | "reversed" | "expired";
  created_at: string;
  updated_at: string;
};

type PaginatedNotifications = {
  data: Notification[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
    totalCount: number;
  };
};

async function fetchNotifications(
  token: string,
  limit: number = 10,
  cursor?: string,
  status?: "unread" | "read" | "reversed" | "expired"
): Promise<PaginatedNotifications> {
  const params = new URLSearchParams({
    limit: limit.toString(),
  });

  if (cursor) {
    params.append("cursor", cursor);
  }

  if (status) {
    params.append("status", status);
  }

  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_URL}/api/v1/notifications?${params}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch notifications: ${response.status}`);
  }

  return response.json();
}

async function markNotificationsAsRead(
  token: string,
  notificationIds: string[]
): Promise<void> {
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_URL}/api/v1/notifications/mark-read`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        notificationIds,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to mark notifications as read: ${response.status}`);
  }
}

export function useNotifications(
  limit: number = 10,
  status?: "unread" | "read" | "reversed" | "expired"
) {
  const { getToken, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ["notifications", { limit, status }],
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new Error("No authentication token available");
      }
      return fetchNotifications(token, limit, undefined, status);
    },
    enabled: isSignedIn,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: true,
    retry: 3,
  });
}

export function useInfiniteNotifications(
  limit: number = 10,
  status?: "unread" | "read" | "reversed" | "expired"
) {
  const { getToken, isSignedIn } = useAuth();

  return useInfiniteQuery({
    queryKey: ["notifications-infinite", { limit, status }],
    queryFn: async ({ pageParam }) => {
      const token = await getToken();
      if (!token) {
        throw new Error("No authentication token available");
      }
      return fetchNotifications(token, limit, pageParam, status);
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
    initialPageParam: undefined as string | undefined,
    enabled: isSignedIn,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    retry: 3,
  });
}

export function useMarkNotificationsAsRead() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationIds: string[]) => {
      const token = await getToken();
      if (!token) {
        throw new Error("No authentication token available");
      }
      return markNotificationsAsRead(token, notificationIds);
    },
    onSuccess: () => {
      // Invalidate and refetch notification-related queries
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-counts"] });
    },
  });
}
