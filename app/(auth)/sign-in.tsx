// app/(auth)/sign-in.tsx - Clean production version
import { useSSO } from "@clerk/clerk-expo";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

WebBrowser.maybeCompleteAuthSession();

export default function SignInPage() {
  useWarmUpBrowser();
  const { startSSOFlow } = useSSO();

  const handleGoogleSignIn = useCallback(async () => {
    try {
      const result = await startSSOFlow({
        strategy: "oauth_google",
        // Let Clerk handle the redirect automatically
      });

      if (result.createdSessionId) {
        await result.setActive!({ session: result.createdSessionId });
      } else if (result.signIn?.status === "complete") {
        await result.setActive!({ session: result.signIn.createdSessionId! });
      } else if (result.signUp?.status === "complete") {
        await result.setActive!({ session: result.signUp.createdSessionId! });
      } else {
        // Handle any remaining edge cases
        console.log("OAuth completed but session not created:", result);
        Alert.alert(
          "Sign-in incomplete",
          "Please try again or contact support if the issue persists."
        );
      }
    } catch (err) {
      console.error("Google sign-in error:", err);
      Alert.alert("Error", "Failed to sign in with Google. Please try again.");
    }
  }, [startSSOFlow]);

  const handleAppleSignIn = useCallback(async () => {
    try {
      const result = await startSSOFlow({
        strategy: "oauth_apple",
      });

      if (result.createdSessionId) {
        await result.setActive!({ session: result.createdSessionId });
      } else if (result.signIn?.status === "complete") {
        await result.setActive!({ session: result.signIn.createdSessionId! });
      } else if (result.signUp?.status === "complete") {
        await result.setActive!({ session: result.signUp.createdSessionId! });
      } else {
        console.log("Apple OAuth completed but session not created:", result);
        Alert.alert(
          "Sign-in incomplete",
          "Please try again or contact support if the issue persists."
        );
      }
    } catch (err) {
      console.error("Apple sign-in error:", err);
      Alert.alert("Error", "Failed to sign in with Apple. Please try again.");
    }
  }, [startSSOFlow]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View className="flex-1 justify-center px-6">
        {/* Logo */}
        <View className="items-center mb-8">
          <Image
            source={require("../../assets/images/icon128.png")}
            className="w-20 h-20"
            resizeMode="contain"
          />
        </View>

        {/* Welcome Text */}
        <View className="mb-12">
          <Text className="text-center text-foreground text-3xl font-bold mb-4">
            Welcome to Idealite
          </Text>
          <Text className="text-center text-muted-foreground text-lg">
            Sign in to continue
          </Text>
        </View>

        {/* Sign-In Buttons */}
        <View className="space-y-4">
          {/* Google Sign-In */}
          <TouchableOpacity
            onPress={handleGoogleSignIn}
            className="bg-white border border-border rounded-xl py-4 px-6 flex-row items-center justify-center shadow-sm"
            activeOpacity={0.8}
          >
            <AntDesign name="google" size={20} color="#4285F4" />
            <Text className="text-foreground text-lg font-medium ml-3">
              Continue with Google
            </Text>
          </TouchableOpacity>

          {/* Apple Sign-In */}
          <TouchableOpacity
            onPress={handleAppleSignIn}
            className="bg-black rounded-xl py-4 px-6 flex-row items-center justify-center mt-4"
            activeOpacity={0.8}
          >
            <Ionicons name="logo-apple" size={20} color="white" />
            <Text className="text-white text-lg font-medium ml-3">
              Continue with Apple
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
