// app/(tabs)/workspace/index.tsx - Main workspace screen
import React from "react";
import { SafeAreaView, Text, View } from "react-native";

export default function WorkspaceScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1">
        <Text>Workspace</Text>
      </View>
      {/* Tag Tree Modal */}
    </SafeAreaView>
  );
}
