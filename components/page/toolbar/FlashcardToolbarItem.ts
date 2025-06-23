// components/page/toolbar/FlashcardToolbarItem.ts
import { ToolbarItem } from "@10play/tentap-editor";
import { Alert } from "react-native";

/**
 * Creates a toolbar item for generating AI flashcards.
 * @param type "question-answer" or "cloze"
 * @param editor the editor bridge instance (from useEditorBridge)
 * @param pageId current page ID
 * @param api API client instance (from useApiClient)
 */
export function createFlashcardItem(
  type: "question-answer" | "cloze",
  editor: any,
  pageId: string,
  api: any
): ToolbarItem {
  const icon =
    type === "cloze"
      ? require("../../../assets/images/cloze.png")
      : require("../../../assets/images/qa.png");

  return {
    onPress: () => () => {
      (async () => {
        try {
          const content = await editor.getHTML();
          const body = await api.post("/api/queue-flashcard", {
            content,
            pageId,
            type,
          });

          Alert.alert(
            "Queued!",
            `Your ${
              type === "cloze" ? "Cloze" : "Q&A"
            } flashcard job is queued (ID: ${body.jobId}).`
          );
        } catch (err: any) {
          console.error("Flashcard generation failed", err);
          Alert.alert("Error", err.message || "Failed to queue flashcard");
        }
      })();
    },
    active: () => false,
    disabled: () => false,
    image: () => icon,
  };
}
