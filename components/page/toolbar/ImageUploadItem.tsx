// toolbar/ImageUploadItem.tsx
import type { EditorBridge } from "@10play/tentap-editor";
import * as ImagePicker from "expo-image-picker";
import { Alert, Platform } from "react-native";
import { useApiClient } from "../../../lib/api/client";

export function createImageUploadItem(editor: EditorBridge) {
  const apiClient = useApiClient();
  const icon = require("../../../assets/images/upload.png");
  return {
    id: "upload-image",
    title: "Upload Image",
    onPress: () => () => {
      (async () => {
        try {
          // 1. Request permission
          const { status } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") {
            Alert.alert("Permission needed to pick an image.");
            return;
          }

          // 2. Launch picker
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.8,
          });
          if (result.canceled) return;

          // 3. Build RN file object
          const uri = result.assets[0].uri;
          const name = uri.split("/").pop() || "photo.jpg";
          const extMatch = /\.(\w+)$/i.exec(name);
          const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";
          const file = {
            uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
            name,
            type: `image/${ext}`,
          };

          // 4. Upload using direct helper (handles FormData + auth)
          const { url } = await apiClient.uploadImageFileDirect(file as any);

          // 5. Insert image into editor
          editor.setImage(url);
        } catch (err: any) {
          console.error("[UploadItem] Error:", err);
          Alert.alert(err.message || "Failed to upload image.");
        }
      })();
    },
    active: () => false,
    disabled: () => false,
    image: () => icon,
  };
}
