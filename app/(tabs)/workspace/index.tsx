// app/(tabs)/workspace/index.tsx - Main workspace screen
import React, { useState } from "react";
import { SafeAreaView, Text, View } from "react-native";
import { TagTreeModal } from "../../../components/TagTreeModal";

export default function WorkspaceScreen() {
  const [showTagTree, setShowTagTree] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1">
        <Text>Workspace</Text>
      </View>
      {/* Tag Tree Modal */}
      <TagTreeModal
        visible={showTagTree}
        onClose={() => setShowTagTree(false)}
      />
    </SafeAreaView>
  );
}
