// app/(onboarding)/_layout.tsx
import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Stack } from "expo-router";
import { ErrorScreen } from "../../components/ErrorScreen";
import { LoadingScreen } from "../../components/LoadingScreen";
import { useUser } from "../../hooks/useUser";

export default function OnboardingLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user, isLoading, error, isOnboarded, refetch } = useUser();

  if (!isLoaded) return <LoadingScreen />;
  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />;
  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} onRetry={refetch} />;
  if (user && isOnboarded) return <Redirect href="/(home)" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
