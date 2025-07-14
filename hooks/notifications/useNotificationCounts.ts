// hooks/notifications/useNotificationCounts.ts
import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";

type NotificationCounts = {
  unread: number;
  read: number;
  reversed: number;
  expired: number;
};

async function fetchNotificationCounts(
  token: string
): Promise<NotificationCounts> {
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_URL}/api/v1/notifications/counts`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch notification counts: ${response.status}`);
  }

  return response.json();
}

export function useNotificationCounts() {
  const { getToken, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ["notification-counts"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new Error("No authentication token available");
      }
      return fetchNotificationCounts(token);
    },
    enabled: isSignedIn,
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    refetchInterval: false, // No polling - manual refresh only
    refetchOnWindowFocus: true, // Refetch when app comes to foreground
    retry: 3,
  });
}
