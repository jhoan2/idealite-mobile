// lib/api/client.ts - Fixed retry logic
import { useAuth } from "@clerk/clerk-expo";
import * as Sentry from "@sentry/react-native";
import { Alert } from "react-native";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const REQUEST_TIMEOUT = 30000;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any,
    public isNetworkError: boolean = false,
    public isAuthError: boolean = false,
    public isRetryable: boolean = false // NEW: Explicit retryable flag
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  skipAuthCheck?: boolean;
}

export const createApiClient = (getToken: () => Promise<string | null>) => {
  const createTimeoutPromise = (timeout: number): Promise<never> => {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new ApiError("Request timeout", 408, null, true, false, true));
      }, timeout);
    });
  };

  const retryRequest = async (
    requestFn: () => Promise<Response>,
    retries: number,
    endpoint: string
  ): Promise<Response> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        const isLastAttempt = attempt === retries;

        // NEW: Only retry if the error is actually retryable
        const isRetryableError = error instanceof ApiError && error.isRetryable;

        if (isLastAttempt || !isRetryableError) {
          // If it's a non-retryable error, don't waste time on more attempts
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          if (!isRetryableError && !isLastAttempt) {
            console.log(
              `Non-retryable error for ${endpoint}, stopping retries:`,
              errorMessage
            );
          }
          throw error;
        }

        // Exponential backoff: wait 1s, 2s, 4s...
        const delayMs = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delayMs));

        console.log(
          `Retrying request to ${endpoint}, attempt ${attempt + 2}/${
            retries + 1
          }`
        );
      }
    }

    throw new Error("Retry logic failed");
  };

  const request = async (
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<any> => {
    const {
      timeout = REQUEST_TIMEOUT,
      retries = 1, // REDUCED: Only 1 retry instead of 2
      skipAuthCheck = false,
      ...fetchOptions
    } = options;

    try {
      // Get authentication token
      let token: string | null = null;
      if (!skipAuthCheck) {
        try {
          token = await getToken();
        } catch (authError) {
          Sentry.captureException(authError, {
            tags: { component: "ApiClient", action: "get_token", endpoint },
          });

          throw new ApiError(
            "Authentication failed. Please log in again.",
            401,
            authError,
            false,
            true,
            false // Auth errors are not retryable
          );
        }
      }

      const url = `${API_BASE_URL}${endpoint}`;
      const config: RequestInit = {
        ...fetchOptions,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...fetchOptions.headers,
        },
      };

      const fetchRequest = () => fetch(url, config);
      const timeoutPromise = createTimeoutPromise(timeout);

      const response = await retryRequest(
        async () => {
          const result = await Promise.race([fetchRequest(), timeoutPromise]);
          return result as Response;
        },
        retries,
        endpoint
      );

      // Handle non-2xx responses
      if (!response.ok) {
        let errorData: any = {};
        const contentType = response.headers.get("content-type");

        if (contentType?.includes("application/json")) {
          try {
            errorData = await response.json();
          } catch {
            errorData = { error: await response.text() };
          }
        }

        const isAuthError = response.status === 401 || response.status === 403;
        const isNetworkError = response.status >= 500;
        const isClientError = response.status >= 400 && response.status < 500;

        // NEW: Smart retryable logic
        const isRetryable =
          isNetworkError || response.status === 408 || response.status === 429;

        // Log non-retryable errors for debugging
        if (isClientError && !isRetryable) {
          console.log(
            `Non-retryable client error ${response.status} for ${endpoint}:`,
            errorData
          );
        }

        throw new ApiError(
          errorData.error || errorData.message || `HTTP ${response.status}`,
          response.status,
          errorData,
          isNetworkError,
          isAuthError,
          isRetryable // NEW: Set retryable flag based on status
        );
      }

      // Parse response
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        return await response.json();
      }

      return await response.text();
    } catch (error) {
      if (error instanceof ApiError) {
        Sentry.captureException(error, {
          tags: {
            component: "ApiClient",
            endpoint,
            httpStatus: error.status.toString(),
            isNetworkError: error.isNetworkError.toString(),
            isAuthError: error.isAuthError.toString(),
            isRetryable: error.isRetryable.toString(), // NEW
          },
          extra: {
            url: `${API_BASE_URL}${endpoint}`,
            options: fetchOptions,
            response: error.response,
          },
          level: error.isNetworkError ? "warning" : "error",
        });

        // Show user-friendly alerts for certain error types
        if (error.isAuthError) {
          Alert.alert(
            "Authentication Error",
            "Your session has expired. Please log in again.",
            [{ text: "OK" }]
          );
        } else if (error.isNetworkError && error.status === 0) {
          Alert.alert(
            "Connection Error",
            "Unable to connect to the server. Please check your internet connection and try again.",
            [{ text: "OK" }]
          );
        }

        throw error;
      }

      // Handle unexpected errors
      console.error("Unexpected API error:", error);
      Sentry.captureException(error, {
        tags: { component: "ApiClient", endpoint, errorType: "unexpected" },
        extra: { url: `${API_BASE_URL}${endpoint}`, options: fetchOptions },
      });

      throw new ApiError(
        "An unexpected error occurred. Please try again.",
        0,
        error,
        true,
        false,
        true // Unexpected errors are retryable
      );
    }
  };

  return {
    get: (endpoint: string, options?: RequestOptions) =>
      request(endpoint, { method: "GET", ...options }),

    post: (endpoint: string, data?: any, options?: RequestOptions) =>
      request(endpoint, {
        method: "POST",
        body: data ? JSON.stringify(data) : undefined,
        ...options,
      }),

    put: (endpoint: string, data?: any, options?: RequestOptions) =>
      request(endpoint, {
        method: "PUT",
        body: data ? JSON.stringify(data) : undefined,
        ...options,
      }),

    delete: (endpoint: string, data?: any, options?: RequestOptions) =>
      request(endpoint, {
        method: "DELETE",
        body: data ? JSON.stringify(data) : undefined,
        ...options,
      }),

    patch: (endpoint: string, data?: any, options?: RequestOptions) =>
      request(endpoint, {
        method: "PATCH",
        body: data ? JSON.stringify(data) : undefined,
        ...options,
      }),

    uploadImageFileDirect: async (file: {
      uri: string;
      name: string;
      type: string;
    }) => {
      const formData = new FormData();
      formData.append("file", file as any);

      let token: string | null;
      try {
        token = await getToken();
      } catch (err) {
        throw new ApiError(
          "Failed to get auth token",
          401,
          err,
          false,
          true,
          false
        );
      }

      const res = await fetch(`${API_BASE_URL}/api/image/cloudflare`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        const isRetryable =
          res.status >= 500 || res.status === 408 || res.status === 429;
        throw new ApiError(
          `Upload failed: ${text}`,
          res.status,
          null,
          res.status >= 500,
          false,
          isRetryable
        );
      }

      const json = await res.json();
      return { url: json.cloudflareData.url };
    },
  };
};

export const useApiClient = () => {
  const { getToken } = useAuth();
  return createApiClient(getToken);
};

export const useApiErrorHandler = () => {
  const handleError = (error: unknown, context?: string) => {
    if (error instanceof ApiError) {
      console.error(`API Error in ${context}:`, {
        message: error.message,
        status: error.status,
        isNetworkError: error.isNetworkError,
        isAuthError: error.isAuthError,
        isRetryable: error.isRetryable, // NEW
      });

      return {
        message: error.message,
        isRetryable: error.isRetryable, // Use the explicit flag
        isAuthError: error.isAuthError,
      };
    }

    console.error(`Unexpected error in ${context}:`, error);
    return {
      message: "An unexpected error occurred",
      isRetryable: true,
      isAuthError: false,
    };
  };

  return { handleError };
};
