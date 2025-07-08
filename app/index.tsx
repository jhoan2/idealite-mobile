// app/index.tsx - Updated with proper user flow
import { ErrorScreen } from "@/components/ErrorScreen";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useUser } from "@/hooks/useUser";
import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user, isLoading, error, isOnboarded, refetch } = useUser();

  // Show loading while Clerk is initializing OR while fetching user data
  if (!isLoaded || (isSignedIn && isLoading)) {
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

  // Wait for user data to load before making routing decisions
  if (!user) {
    return <LoadingScreen />;
  }

  // Now we can safely check onboarding status
  if (!isOnboarded) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  // User is onboarded, go to tabs
  return <Redirect href="/(tabs)/home" />;
}
