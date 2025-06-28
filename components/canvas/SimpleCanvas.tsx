// components/canvas/SimpleCanvasWebView.tsx
import { useAuth } from "@clerk/clerk-expo";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import React, { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { WebView } from "react-native-webview";
import ImageUploadBottomSheet from "./ImageUploadBottomSheet";

export default function SimpleCanvasWebView({ pageId }: { pageId: string }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [authToken, setAuthToken] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);

  const snapPoints = ["25%", "50%", "100%"];

  const handleAddToCanvas = (message: any) => {
    // Send message to WebView
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify(message));
    }
  };

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

  if (!authToken) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Setting up auth…</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {/* WebView */}
        <WebView
          ref={webViewRef}
          style={{ flex: 1 }}
          source={{
            uri: `${process.env.EXPO_PUBLIC_API_URL}/mobile-canvas?pageId=${pageId}`,
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }}
          userAgent="IdealiteMobile/1.0"
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          onMessage={(e) => {
            const messageData = e.nativeEvent.data;

            try {
              const parsed = JSON.parse(messageData);

              if (parsed.type === "RETRY") {
                webViewRef.current?.reload();
              } else if (parsed.type === "OPEN_IMAGE_TOOLS") {
                bottomSheetRef.current?.expand();
              } else if (parsed.type === "IMAGE_ADDED_SUCCESS") {
                bottomSheetRef.current?.close();
              } else if (parsed.type === "IMAGE_ADD_ERROR") {
                console.error("Image add error:", parsed.error);
              }
            } catch (error) {
              console.error("Error parsing WebView message:", error);
            }
          }}
          onError={(e) => {
            console.error("Canvas WebView error:", e.nativeEvent);
          }}
        />

        {/* Bottom Sheet with Image Upload Component */}
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={snapPoints}
          index={-1}
          enablePanDownToClose
        >
          <BottomSheetView style={{ flex: 1 }}>
            <ImageUploadBottomSheet
              authToken={authToken}
              onAddToCanvas={handleAddToCanvas}
            />
          </BottomSheetView>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
}
