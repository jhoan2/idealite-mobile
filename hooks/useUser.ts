// hooks/useUser.ts
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

interface User {
  id: string;
  clerk_id: string;
  email: string;
  is_onboarded: boolean;
  role: string;
  // ... other user fields
}

export const useUser = () => {
  const { getToken, userId, isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  // Query for user data
  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["user", userId],
    queryFn: async (): Promise<User> => {
      if (!isSignedIn || !userId) {
        throw new Error("Not authenticated");
      }

      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.status}`);
      }

      return response.json();
    },
    enabled: !!isSignedIn && !!userId, // Only run when authenticated
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  // Mutation for updating user
  const updateUserMutation = useMutation({
    mutationFn: async (updateData: any) => {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update user: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (updatedUser) => {
      // Update the cache with the new user data
      queryClient.setQueryData(["user", userId], updatedUser);
    },
  });

  return {
    user,
    isLoading,
    error: error?.message || null,
    isOnboarded: user?.is_onboarded ?? false,
    refetch,
    updateUser: updateUserMutation.mutate,
    isUpdating: updateUserMutation.isPending,
  };
};

// Query for template tags
export const useTemplateTags = () => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["template-tags"],
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/v1/tags/template`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch template tags: ${response.status}`);
      }

      return response.json();
    },
    staleTime: 10 * 60 * 1000, // Template tags don't change often
  });
};
