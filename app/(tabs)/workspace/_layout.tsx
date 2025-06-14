// app/(tabs)/workspace/_layout.tsx - Stack navigator for workspace
import { Stack } from "expo-router";

export default function WorkspaceLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true, // Enable headers - they handle safe areas automatically
        headerStyle: {
          backgroundColor: "#ffffff",
        },
        headerTintColor: "#18181b",
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 18,
        },
        headerShadowVisible: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Workspace",
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: "Edit Note",
          // Hide tab bar when editing notes
          presentation: "card",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="new"
        options={{
          title: "New Note",
          presentation: "modal", // Present as modal for creating new notes
        }}
      />
    </Stack>
  );
}
