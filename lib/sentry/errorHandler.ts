// lib/sentry/errorHandler.ts
import * as Sentry from "@sentry/react-native";

interface ErrorOptions {
  operation: string;
  component?: string;
  level?: "warning" | "error" | "fatal";
  context?: Record<string, any>;
}

export function captureAndFormatError(
  error: unknown,
  options: ErrorOptions
): string {
  const { operation, component, level = "error", context } = options;

  // Capture in Sentry
  if (error instanceof Error) {
    Sentry.captureException(error, {
      level,
      tags: { operation, component },
      extra: { ...context, operation },
    });
  } else {
    const sentryError = new Error(
      `Unknown error during ${operation}: ${String(error)}`
    );
    Sentry.captureException(sentryError, {
      level,
      tags: { operation, component },
      extra: { originalError: error, ...context },
    });
  }

  // Return user-friendly message
  if (error instanceof Error) {
    if (error.message.includes("UNIQUE constraint")) {
      return "A page with this title already exists";
    }
    if (error.message.includes("NOT NULL constraint")) {
      return "Required information is missing";
    }
    if (error.message.includes("network") || error.message.includes("fetch")) {
      return "Network connection failed. Please try again.";
    }
    return error.message;
  }

  return `Failed to ${operation}. Please try again.`;
}
