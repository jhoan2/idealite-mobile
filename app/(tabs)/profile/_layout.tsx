// app/(tabs)/profile/_layout.tsx
import { Stack } from "expo-router";

export default function ProfileLayout() {
  console.log("👤 ProfileLayout rendering");
  return <Stack screenOptions={{ headerShown: false }} />;
}
