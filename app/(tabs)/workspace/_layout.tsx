// app/(tabs)/workspace/_layout.tsx - Stack navigator for workspace
import { Stack } from "expo-router";

export default function WorkspaceLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // We'll handle headers in individual screens
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
