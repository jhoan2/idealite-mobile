import { useLocalSearchParams } from "expo-router";
import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { ErrorScreen } from "../../../components/ErrorScreen";
import { LoadingScreen } from "../../../components/LoadingScreen";
import BodyEditor from "../../../components/page/BodyEditor";
import HeadingEditor from "../../../components/page/HeadingEditor";
import { usePage } from "../../../hooks/page/usePage";

export default function NoteEditorScreen() {
  const { id: pageId } = useLocalSearchParams<{ id: string }>();
  const { page, isLoading, error, refetch } = usePage(pageId!);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error || !page) {
    return <ErrorScreen message={error?.message} onRetry={refetch} />;
  }

  return (
    <SafeAreaView style={styles.screen}>
      <HeadingEditor pageId={pageId!} placeholder="Enter page title..." />
      <BodyEditor
        pageId={pageId!}
        initialContent={page.content ?? "<p>Start writing…</p>"}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
