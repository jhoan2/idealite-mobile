// hooks/useTemplateTags.ts - Simple version for testing
import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export const useTemplateTags = () => {
  const { getToken, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ["template-tags"],
    queryFn: async () => {
      if (!isSignedIn) {
        throw new Error("Not authenticated");
      }

      const token = await getToken();
      const url = `${API_BASE_URL}/api/v1/tags/template`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch template tags: ${response.status} - ${errorText}`
        );
      }

      return response.json();
    },
    enabled: !!isSignedIn,
    staleTime: 10 * 60 * 1000, // 10 minutes - template tags don't change often
    retry: 3,
  });
};
