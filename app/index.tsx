// app/index.tsx - Start with this simple version
import { LoadingScreen } from "@/components/LoadingScreen";
import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();

  // Show loading while Clerk is initializing
  if (!isLoaded) {
    return <LoadingScreen />;
  }

  // If not signed in, go to auth
  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // If signed in, go to tabs for now (we'll add onboarding check later)
  return <Redirect href="/(tabs)/home" />;
}
