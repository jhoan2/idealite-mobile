import { useAuth, useUser } from "@clerk/clerk-expo";
import React from "react";
import { ActivityIndicator, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProfilePlaceholder from "../../../components/profile/ProfilePlaceholder";
import Settings from "../../../components/profile/Settings";

export default function ProfileScreen() {
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();

  // Show loading state while Clerk is initializing
  if (!userLoaded || !authLoaded) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={["top", "bottom"]}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  // Show placeholder if user is not signed in
  if (!isSignedIn || !user) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <ProfilePlaceholder />
      </SafeAreaView>
    );
  }

  // Extract user data in the same format as web app
  const userData = {
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    imageUrl: user.imageUrl,
    email: user.emailAddresses?.[0]?.emailAddress || null,
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <Settings user={userData} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666666",
  },
});
