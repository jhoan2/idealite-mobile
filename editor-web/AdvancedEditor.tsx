import { TenTapStartKit, useTenTap } from "@10play/tentap-editor";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Typography from "@tiptap/extension-typography";
import { EditorContent } from "@tiptap/react";
import { PasteUpload } from "./lib/PasteUpload";

/**
 * Here we control the web side of our custom editor
 */
export const AdvancedEditor = () => {
  const editor = useTenTap({
    bridges: [...TenTapStartKit],
    tiptapOptions: {
      extensions: [Document, Paragraph, Text, Typography, PasteUpload],
    },
  });
  return (
    <EditorContent
      editor={editor}
      className={window.dynamicHeight ? "dynamic-height" : undefined}
    />
  );
};
