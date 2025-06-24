import { Extension } from "@tiptap/core";
import { Plugin } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { uploadToCloudflare } from "./uploadToCloudflare";

/**
 * Minimal plugin that intercepts paste & drag-drop,
 * uploads any image files, and inserts <img src="…"> nodes.
 */
export const PasteUpload = Extension.create({
  name: "paste-upload",

  addProseMirrorPlugins() {
    /** Upload helper & node insertion */
    const insertUploaded = async (view: EditorView, files: File[]) => {
      const urls = await Promise.all(files.map(uploadToCloudflare));
      const { state, dispatch } = view;

      urls.forEach((src) => {
        const imageNode = state.schema.nodes.image.create({ src });
        dispatch(state.tr.replaceSelectionWith(imageNode).scrollIntoView());
      });
    };

    /** Pick out image blobs from clipboard / drag items */
    const getImageFiles = (items: DataTransferItemList | null): File[] =>
      items
        ? Array.from(items)
            .filter((i) => i.kind === "file" && i.type.startsWith("image/"))
            .map((i) => i.getAsFile())
            .filter((f): f is File => !!f)
        : [];

    /** Shared handler for paste & drop */
    const handle =
      (view: EditorView) =>
      (evt: ClipboardEvent | DragEvent): boolean => {
        const items =
          "clipboardData" in evt
            ? (evt as ClipboardEvent).clipboardData?.items
            : (evt as DragEvent).dataTransfer?.items;

        const files = getImageFiles(items || null);
        if (!files.length) return false; // let default flow continue

        evt.preventDefault(); // stop base64 paste
        void insertUploaded(view, files);
        return true;
      };

    return [
      new Plugin({
        props: {
          handlePaste: (view, e) => handle(view)(e),
          handleDrop: (view, e) => handle(view)(e),
        },
      }),
    ];
  },
});
