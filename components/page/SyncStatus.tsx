// Example: components/SyncStatus.tsx
import { useSync } from "@/hooks/page/useSync";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

export function SyncStatus() {
  const { isSyncing, isOnline, lastSyncResult, triggerSync } = useSync();

  return (
    <View className="flex-row items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
      {/* Network status */}
      <View className="flex-row items-center gap-1">
        <View
          className={`w-2 h-2 rounded-full ${
            isOnline ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <Text className="text-xs text-gray-600">
          {isOnline ? "Online" : "Offline"}
        </Text>
      </View>

      {/* Sync status */}
      {isSyncing && (
        <View className="flex-row items-center gap-1">
          <ActivityIndicator size="small" />
          <Text className="text-xs text-gray-600">Syncing...</Text>
        </View>
      )}

      {/* Last sync result */}
      {lastSyncResult && !isSyncing && (
        <Text className="text-xs text-gray-600">
          {lastSyncResult.success
            ? `Synced ${
                lastSyncResult.uploadedPages + lastSyncResult.downloadedPages
              } pages`
            : `Sync failed (${lastSyncResult.errors.length} errors)`}
        </Text>
      )}

      {/* Manual sync button */}
      <TouchableOpacity
        onPress={triggerSync}
        disabled={isSyncing || !isOnline}
        className="ml-auto"
      >
        <Ionicons
          name="refresh"
          size={16}
          color={isSyncing || !isOnline ? "#9CA3AF" : "#374151"}
        />
      </TouchableOpacity>
    </View>
  );
}
