// components/canvas/SimpleCanvasWebView.tsx
import { useAuth } from "@clerk/clerk-expo";
import CookieManager from "@react-native-cookies/cookies";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { WebView } from "react-native-webview";

export default function SimpleCanvasWebView({ pageId }: { pageId: string }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [ready, setReady] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // 1) Wait for Clerk to finish loading and user to be signed in
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      console.warn("User not signed in");
      return;
    }
    getToken().then((t) => {
      if (!t) throw new Error("No token");
      setAuthToken(t);
    });
  }, [isLoaded, isSignedIn, getToken]);

  // 2) Once we have a token, set the cookie on the native side
  useEffect(() => {
    if (!authToken) return;
    const url = process.env.EXPO_PUBLIC_API_URL!;
    const domain = new URL(url).hostname;
    const cookieOpts = {
      domain,
      path: "/",
      secure: true,
      httpOnly: false,
      sameSite: "none" as const,
    };

    Promise.all(
      ["__session", "__clerk_session", "clerk-session"].map((name) =>
        CookieManager.set(url, { name, value: authToken, ...cookieOpts })
      )
    )
      .then(() => setReady(true))
      .catch(console.error);
  }, [authToken]);

  if (!ready) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Setting up auth…</Text>
      </View>
    );
  }

  // 3) Build our injected script to prime localStorage/cookies before the page loads
  const preInject = `
    (function() {
      document.cookie = "__session=${authToken}; path=/; secure; samesite=none";
      // any other window/localStorage setup…
    })();
    true;
  `;

  return (
    <WebView
      style={{ flex: 1 }}
      // -- Basic URL Source pattern
      source={{
        uri: `${process.env.EXPO_PUBLIC_API_URL}/mobile-canvas?pageId=${pageId}`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }}
      // -- set a custom UA per platform
      userAgent="IdealiteMobile/1.0"
      // -- inject *before* content loads
      injectedJavaScriptBeforeContentLoaded={preInject}
      javaScriptEnabled
      domStorageEnabled
      startInLoadingState
      onMessage={(e) => console.log("Message from canvas:", e.nativeEvent.data)}
      onError={(e) => console.error("Canvas WebView error", e.nativeEvent)}
    />
  );
}
