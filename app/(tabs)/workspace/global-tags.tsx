// app/(tabs)/global-tags.tsx
import { useAuth } from "@clerk/clerk-expo";
import CookieManager from "@react-native-cookies/cookies";
import * as Sentry from "@sentry/react-native";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import { Alert, StatusBar, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

interface WebViewMessage {
  type: string;
  tagId?: string;
  tagName?: string;
  error?: string;
}

export default function GlobalTagsScreen() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [cookieSynced, setCookieSynced] = useState(false);
  const webViewRef = useRef<WebView>(null);

  // Grab Clerk JWT - same pattern as your canvas
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    getToken()
      .then((t) => {
        if (!t) throw new Error("No token");
        setAuthToken(t);
      })
      .catch((error) => {
        console.error("Failed to get auth token:", error);
        Sentry.captureException(error, {
          tags: {
            component: "GlobalTagsScreen",
            function: "getToken",
          },
        });
      });
  }, [isLoaded, isSignedIn, getToken]);

  // Sync __session cookie into WebView - same pattern as your canvas
  useEffect(() => {
    if (!authToken) return;

    const apiUrl = process.env.EXPO_PUBLIC_API_URL!;

    CookieManager.set(apiUrl, {
      name: "__session",
      value: authToken,
      domain: new URL(apiUrl).hostname,
      path: "/",
      version: "1",
      secure: true,
      httpOnly: false,
    })
      .then(() => {
        setCookieSynced(true);
      })
      .catch((error) => {
        console.error("Failed to sync cookies:", error);
        Sentry.captureException(error, {
          tags: {
            component: "GlobalTagsScreen",
            function: "cookieSync",
          },
        });
      });
  }, [authToken]);

  // Handle messages from WebView - similar to your canvas message handler
  const handleWebViewMessage = async (e: any) => {
    try {
      const parsed: WebViewMessage = JSON.parse(e.nativeEvent.data);

      switch (parsed.type) {
        case "RETRY":
          webViewRef.current?.reload();
          break;

        case "TAG_ADDED_SUCCESS":
          // Haptic feedback for successful tag addition
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          );

          webViewRef.current?.reload();
          break;

        case "TAG_ADD_ERROR":
          // Haptic feedback for error
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error
          );

          // Handle specific error types
          let errorTitle = "Error";
          let errorMessage = parsed.error || "Failed to add tag";

          if (parsed.error?.includes("Unauthorized")) {
            errorTitle = "Authentication Error";
            errorMessage = "Please try signing out and signing back in.";
          } else if (parsed.error?.includes("already exists")) {
            errorTitle = "Tag Already Added";
            errorMessage = "This tag is already in your workspace.";
          } else if (parsed.error?.includes("not found")) {
            errorTitle = "Tag Not Found";
            errorMessage = "The selected tag could not be found.";
          }

          Alert.alert(errorTitle, errorMessage, [
            ...(parsed.error?.includes("Unauthorized")
              ? [{ text: "Retry", onPress: () => webViewRef.current?.reload() }]
              : []),
            { text: "OK" },
          ]);
          break;

        case "HAPTIC_IMPACT":
          // Light haptic feedback for touch interactions
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;

        case "HAPTIC_SELECTION":
          // Selection haptic feedback
          await Haptics.selectionAsync();
          break;

        default:
          break;
      }
    } catch (err) {
      console.error("Error parsing Global Tags WebView message:", err);

      Sentry.captureException(err, {
        tags: {
          component: "GlobalTagsScreen",
          function: "handleWebViewMessage",
          api: "v1-mobile-global-tags",
        },
        extra: {
          rawMessage: e.nativeEvent.data,
        },
      });
    }
  };

  const handleWebViewError = (e: any) => {
    console.error("WebView Error:", e.nativeEvent);

    Sentry.captureException(new Error("WebView Error"), {
      tags: {
        component: "GlobalTagsScreen",
        function: "handleWebViewError",
        api: "v1-mobile-global-tags",
      },
      extra: {
        nativeEvent: e.nativeEvent,
      },
    });
  };

  const handleHttpError = (e: any) => {
    console.error("WebView HTTP Error:", e.nativeEvent);

    Sentry.captureException(new Error("WebView HTTP Error"), {
      tags: {
        component: "GlobalTagsScreen",
        function: "handleHttpError",
        api: "v1-mobile-global-tags",
      },
      extra: {
        nativeEvent: e.nativeEvent,
      },
    });

    // Show user-friendly error for auth issues
    if (e.nativeEvent.statusCode === 401) {
      Alert.alert(
        "Authentication Error",
        "Please try signing out and signing back in.",
        [
          { text: "Retry", onPress: () => webViewRef.current?.reload() },
          { text: "OK" },
        ]
      );
    } else if (e.nativeEvent.statusCode >= 500) {
      Alert.alert(
        "Server Error",
        "There seems to be a server issue. Please try again later.",
        [
          { text: "Retry", onPress: () => webViewRef.current?.reload() },
          { text: "OK" },
        ]
      );
    }
  };

  // Show loading state while setting up auth - same pattern as your canvas
  if (!authToken || !cookieSynced) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
        <Text style={styles.loadingText}>Setting up auth…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

      <WebView
        ref={webViewRef}
        style={styles.webview}
        source={{
          uri: `${process.env.EXPO_PUBLIC_API_URL}/mobile/global-tags`,
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }}
        userAgent="IdealiteMobile/1.0" // Same user agent as your canvas
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        onMessage={handleWebViewMessage}
        onError={handleWebViewError}
        onHttpError={handleHttpError}
        // Performance optimizations for the circle visualization
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        androidLayerType="hardware"
        mixedContentMode="compatibility"
        // Disable context menu and link preview for better interaction
        allowsLinkPreview={false}
        // Allow proper scrolling/zooming for the canvas
        scalesPageToFit={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        bounces={false}
        scrollEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  webview: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "500",
  },
});
