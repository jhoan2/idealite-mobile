// app/index.tsx - Updated with proper user flow
import { ErrorScreen } from "@/components/ErrorScreen";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useUser } from "@/hooks/useUser";
import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user, isLoading, error, isOnboarded, refetch } = useUser();

  // Show loading while Clerk is initializing
  if (!isLoaded || isLoading) {
    return <LoadingScreen />;
  }

  // If not signed in, go to auth
  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // If there's an error loading user data
  if (error) {
    return <ErrorScreen message={error} onRetry={refetch} />;
  }

  // If user exists but not onboarded, go to onboarding
  if (user && !isOnboarded) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  // If user is onboarded, go to tabs
  if (user && isOnboarded) {
    return <Redirect href="/(tabs)/home" />;
  }

  // Fallback loading state
  return <LoadingScreen />;
}
