// app/(tabs)/_layout.tsx - Using Expo Router's native tabs
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import Entypo from "@expo/vector-icons/Entypo";
import * as Sentry from "@sentry/react-native";
import { Redirect, Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ErrorScreen } from "../../components/ErrorScreen";
import { HapticTab } from "../../components/HapticTab";
import { LoadingScreen } from "../../components/LoadingScreen";
import { useUser } from "../../hooks/useUser";

export default function TabLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user, isLoading, error, isOnboarded, refetch } = useUser();
  const insets = useSafeAreaInsets();

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

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#18181b", // primary color
        tabBarInactiveTintColor: "#71717a", // muted-foreground
        tabBarStyle: {
          backgroundColor: "#ffffff", // background
          borderTopColor: "#e4e4e7", // border
          borderTopWidth: 1,
          paddingBottom: insets.bottom,
          height: 50 + insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
        headerShown: false,
        tabBarButton: HapticTab, // Add haptic feedback
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="workspace"
        options={{
          title: "Workspace",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "folder" : "folder-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="review"
        options={{
          title: "Review",
          tabBarIcon: ({ color, focused }) => (
            <Entypo name="inbox" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
