// providers/DatabaseProvider.tsx
import { drizzle } from "drizzle-orm/expo-sqlite";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import * as SQLite from "expo-sqlite";
import React, { createContext, useContext, useEffect, useState } from "react";
import { ErrorScreen } from "../components/ErrorScreen";
import { LoadingScreen } from "../components/LoadingScreen";
import migrations from "../drizzle/migrations";
import { captureAndFormatError } from "../lib/sentry/errorHandler";

// Initialize database connection
const expo = SQLite.openDatabaseSync("db.db");
export const db = drizzle(expo);

interface DatabaseContextType {
  db: typeof db;
  isReady: boolean;
  error: string | null;
  retry: () => void;
}

const DatabaseContext = createContext<DatabaseContextType | null>(null);

interface DatabaseProviderProps {
  children: React.ReactNode;
}

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Run database migrations
  const { success, error: migrationError } = useMigrations(db, migrations);
  if (__DEV__) {
    useDrizzleStudio(expo);
  }
  useEffect(() => {
    if (success) {
      setIsReady(true);
      setError(null);
    } else if (migrationError) {
      const errorMessage = captureAndFormatError(migrationError, {
        operation: "database migration",
        component: "DatabaseProvider",
        level: "fatal",
        context: {
          retryCount,
          migrationError: migrationError.message,
        },
      });
      setError(errorMessage);
      setIsReady(false);
    }
  }, [success, migrationError, retryCount]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    setError(null);

    try {
      // Log retry attempt
      captureAndFormatError(new Error("Database migration retry attempted"), {
        operation: "database migration retry",
        component: "DatabaseProvider",
        level: "warning",
        context: { retryCount: retryCount + 1 },
      });

      // You could implement app restart using expo-updates:
      // import * as Updates from 'expo-updates';
      // Updates.reloadAsync();

      // For now, just show alert and hope user restarts manually
      alert("Database error occurred. Please restart the app.");
    } catch (retryError) {
      captureAndFormatError(retryError, {
        operation: "database retry",
        component: "DatabaseProvider",
        level: "error",
      });
    }
  };

  // Provide database context to children
  const contextValue: DatabaseContextType = {
    db,
    isReady,
    error,
    retry: handleRetry,
  };

  return (
    <DatabaseContext.Provider value={contextValue}>
      {/* Always render children to maintain consistent component tree */}
      {children}

      {/* Show loading overlay while migrations are running */}
      {!success && !migrationError && <LoadingScreen />}

      {/* Show error overlay if migrations failed */}
      {error && migrationError && (
        <ErrorScreen
          message={`Database setup failed: ${error}`}
          onRetry={handleRetry}
        />
      )}
    </DatabaseContext.Provider>
  );
}

// Hook to use database context
export function useDatabase() {
  const context = useContext(DatabaseContext);

  if (!context) {
    throw new Error("useDatabase must be used within a DatabaseProvider");
  }

  if (!context.isReady) {
    throw new Error(
      "Database is not ready. Make sure migrations have completed."
    );
  }

  return context;
}

// Hook to get database status (useful for loading states)
export function useDatabaseStatus() {
  const context = useContext(DatabaseContext);

  if (!context) {
    throw new Error("useDatabaseStatus must be used within a DatabaseProvider");
  }

  return {
    isReady: context.isReady,
    error: context.error,
    retry: context.retry,
  };
}
