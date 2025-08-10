// app/(tabs)/_layout.tsx - Updated to use NavigationWrapper
import { useAuth } from "@clerk/clerk-expo";
import * as Sentry from "@sentry/react-native";
import { Redirect, Stack } from "expo-router";
import { ErrorScreen } from "../../components/ErrorScreen";
import { LoadingScreen } from "../../components/LoadingScreen";
import { NavigationWrapper } from "../../components/NavigationWrapper";
import { useUser } from "../../hooks/useUser";

export default function TabLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user, isLoading, error, isOnboarded, refetch } = useUser();

  // Loading states
  if (!isLoaded || isLoading) {
    return <LoadingScreen />;
  }

  // Redirect if not signed in
  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // Error handling
  if (error) {
    Sentry.captureException(new Error(error), {
      tags: { component: "TabLayout" },
    });
    return <ErrorScreen message={error} onRetry={refetch} />;
  }

  // Redirect to onboarding if not completed
  if (user && !isOnboarded) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  // Wrap the entire tab navigation with NavigationWrapper
  return (
    <NavigationWrapper>
      <Stack
        screenOptions={{
          headerShown: false, // Since NavigationWrapper provides the header
        }}
      >
        <Stack.Screen name="home" />
        <Stack.Screen name="workspace" />
        <Stack.Screen name="review" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="notifications" />
      </Stack>
    </NavigationWrapper>
  );
}
