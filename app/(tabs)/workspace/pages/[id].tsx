// app/(tabs)/workspace/pages/[id].tsx - SQLite Loading Version
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  View,
} from "react-native";
import BodyEditor from "../../../../components/page/BodyEditor";
import HeadingEditor from "../../../../components/page/HeadingEditor";
import { pageRepository } from "../../../../db/pageRepository";
import { type Page } from "../../../../db/schema";
import { captureAndFormatError } from "../../../../lib/sentry/errorHandler";

export default function NoteEditorScreen() {
  const { id: pageId } = useLocalSearchParams<{ id: string }>();
  const [page, setPage] = useState<Page | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pageIdNumber = parseInt(pageId as string);

  useEffect(() => {
    const loadPage = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const localPage = await pageRepository.findById(pageIdNumber);

        if (localPage) {
          setPage(localPage);
        } else {
          const errorMessage = `Page not found with ID: ${pageIdNumber}`;
          console.error("❌ NoteEditorScreen:", errorMessage);
          setError(errorMessage);
          Alert.alert("Error", errorMessage);
        }
      } catch (err) {
        console.error("❌ NoteEditorScreen: Error loading page:", err);
        const errorMessage = captureAndFormatError(err, {
          operation: "load page in NoteEditorScreen",
          component: "NoteEditorScreen",
          level: "error",
          context: { pageId, pageIdNumber },
        });
        setError(errorMessage);
        Alert.alert("Error", errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (pageIdNumber && !isNaN(pageIdNumber)) {
      loadPage();
    } else {
      console.error("❌ NoteEditorScreen: Invalid pageId:", pageId);
      setError("Invalid page ID");
      setIsLoading(false);
    }
  }, [pageId, pageIdNumber]);

  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error || !page) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.errorContainer}>
          {/* Add error component here if needed */}
        </View>
      </SafeAreaView>
    );
  }

  // Render with actual content from SQLite
  const initialContent = page.content || "<p>Start writing…</p>";

  return (
    <SafeAreaView style={styles.screen}>
      <HeadingEditor pageId={pageId!} placeholder="Enter page title..." />

      {/* Pass the real content from SQLite */}
      <BodyEditor pageId={pageId!} initialContent={initialContent} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
