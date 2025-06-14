// app/(tabs)/review/_layout.tsx
import { Stack } from "expo-router";

export default function ReviewLayout() {
  console.log("📖 ReviewLayout rendering");
  return <Stack screenOptions={{ headerShown: false }} />;
}
