// lib/api/client.ts
import { useAuth } from "@clerk/clerk-expo";
import * as Sentry from "@sentry/react-native";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://your-app.vercel.app";

export class ApiError extends Error {
  constructor(message: string, public status: number, public response?: any) {
    super(message);
    this.name = "ApiError";
  }
}

export const createApiClient = (getToken: () => Promise<string | null>) => {
  const request = async (
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> => {
    try {
      const token = await getToken();

      const url = `${API_BASE_URL}${endpoint}`;
      const config: RequestInit = {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
      };

      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || `HTTP ${response.status}`,
          response.status,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      Sentry.captureException(error, {
        tags: {
          component: "ApiClient",
          endpoint,
        },
      });

      throw new ApiError("Network request failed", 0, error);
    }
  };

  return {
    get: (endpoint: string) => request(endpoint, { method: "GET" }),
    post: (endpoint: string, data?: any) =>
      request(endpoint, {
        method: "POST",
        body: data ? JSON.stringify(data) : undefined,
      }),
    put: (endpoint: string, data?: any) =>
      request(endpoint, {
        method: "PUT",
        body: data ? JSON.stringify(data) : undefined,
      }),
    delete: (endpoint: string, data?: any) =>
      request(endpoint, {
        method: "DELETE",
        body: data ? JSON.stringify(data) : undefined,
      }),
  };
};

// Hook to get authenticated API client
export const useApiClient = () => {
  const { getToken } = useAuth();
  return createApiClient(getToken);
};
