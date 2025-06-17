// hooks/useDashboardData.ts
import { useAuth } from "@clerk/clerk-expo";
import * as Sentry from "@sentry/react-native";
import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "../lib/api/client";

// Types matching your dashboard API response
export type CardActivityStats = {
  cardsCreatedThisWeek: number;
  cardsReviewedThisWeek: number;
  cardsDueThisWeek: number;
  reviewCompletionRate: number;
  createdChangePercent: number;
  reviewedChangePercent: number;
  dueChangePercent: number;
  completionRateChange: number;
};

export type TagMasteryData = {
  name: string;
  mastered: number;
  active: number;
  suspended: number;
  total: number;
};

export type CardStatusData = {
  status: string;
  count: number;
  color: string;
};

export type DashboardResponse = {
  cardActivity: CardActivityStats;
  tagMastery: TagMasteryData[];
  cardDistribution: CardStatusData[];
  totalCards: number;
};

export const useDashboardData = () => {
  const { isSignedIn } = useAuth();
  const apiClient = useApiClient();

  return useQuery<DashboardResponse>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      return await apiClient.get("/api/v1/dashboard");
    },
    enabled: !!isSignedIn,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      // Retry up to 3 times for network errors
      if (failureCount < 3) {
        return true;
      }
      return false;
    },
    meta: {
      onError: (error: Error) => {
        Sentry.captureException(error, {
          tags: {
            component: "useDashboardData",
            action: "fetchDashboard",
          },
        });
      },
    },
  });
};
