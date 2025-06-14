import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

interface CompleteOnboardingData {
  selectedTagIds: string[];
}

export const useCompleteOnboarding = () => {
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CompleteOnboardingData) => {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/v1/users/tags`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tagIds: data.selectedTagIds,
          completeOnboarding: true, // This will also mark user as onboarded
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.details ||
            `Failed to complete onboarding: ${response.status}`
        );
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate user data to trigger a refetch with updated is_onboarded status
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
    },
  });
};

// Hook for managing user tags (for future profile editing)
export const useUserTags = () => {
  const { getToken, userId, isSignedIn } = useAuth();

  return useMutation({
    mutationFn: async (tagIds: string[]) => {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/v1/users/tags`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tagIds: tagIds,
          completeOnboarding: false, // Just updating tags, not completing onboarding
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.details || `Failed to update tags: ${response.status}`
        );
      }

      return response.json();
    },
  });
};
