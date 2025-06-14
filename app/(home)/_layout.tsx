// app/(home)/_layout.tsx - With onboarding check
import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Stack } from "expo-router";
import { ErrorScreen } from "../../components/ErrorScreen";
import { LoadingScreen } from "../../components/LoadingScreen";
import { useUser } from "../../hooks/useUser";

export default function HomeRoutesLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user, isLoading, error, isOnboarded, refetch } = useUser();

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  // If user is not signed in, redirect to sign-in page
  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen message={error} onRetry={refetch} />;
  }

  // If user data loaded but not onboarded, redirect to onboarding
  if (user && !isOnboarded) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  // If user is signed in and onboarded, show the home routes
  return <Stack screenOptions={{ headerShown: false }} />;
}
