// components/canvas/SimpleCanvasWebView.tsx
import { useAuth } from "@clerk/clerk-expo";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import CookieManager from "@react-native-cookies/cookies";
import React, { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { WebView } from "react-native-webview";
import ImageUploadBottomSheet from "./ImageUploadBottomSheet";

export default function SimpleCanvasWebView({ pageId }: { pageId: string }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [cookieSynced, setCookieSynced] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Grab Clerk JWT
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    getToken().then((t) => {
      if (!t) throw new Error("No token");
      setAuthToken(t);
    });
  }, [isLoaded, isSignedIn, getToken]);

  // Sync __session cookie into WebView
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
    }).then(() => {
      setCookieSynced(true);
    });
  }, [authToken]);

  if (!authToken || !cookieSynced) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Setting up auth…</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <WebView
          ref={webViewRef}
          style={{ flex: 1 }}
          source={{
            uri: `${process.env.EXPO_PUBLIC_API_URL}/mobile/canvas?pageId=${pageId}`,
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }}
          userAgent="IdealiteMobile/1.0"
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          onMessage={(e) => {
            const parsed = JSON.parse(e.nativeEvent.data);
            if (parsed.type === "RETRY") webViewRef.current?.reload();
            if (parsed.type === "OPEN_IMAGE_TOOLS")
              bottomSheetRef.current?.expand();
            if (parsed.type === "IMAGE_ADDED_SUCCESS")
              bottomSheetRef.current?.close();
            if (parsed.type === "IMAGE_ADD_ERROR")
              console.error("Image add error:", parsed.error);
          }}
          onError={(e) => {
            console.error("Canvas WebView error:", e.nativeEvent);
          }}
        />

        {/* Image Tools Bottom Sheet */}
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={["25%", "50%", "100%"]}
          index={-1}
          enablePanDownToClose
        >
          <BottomSheetView style={{ flex: 1 }}>
            <ImageUploadBottomSheet
              authToken={authToken}
              onAddToCanvas={(msg) => {
                webViewRef.current?.postMessage(JSON.stringify(msg));
              }}
            />
          </BottomSheetView>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
}
