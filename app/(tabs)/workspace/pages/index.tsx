// app/(tabs)/workspace/pages.tsx
import { PageList } from "@/components/page/PageList";
import { SafeAreaView, View } from "react-native";

export default function AllPagesScreen() {
  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1 p-6">
        <PageList />
      </View>
    </SafeAreaView>
  );
}
