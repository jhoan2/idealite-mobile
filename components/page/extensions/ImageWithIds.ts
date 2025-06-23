// components/page/extensions/ImageWithIds.ts

import type { BridgeExtension } from "@10play/tentap-editor";
import { ImageBridge } from "@10play/tentap-editor";
import { mergeAttributes } from "@tiptap/core";
import { v4 as uuidv4 } from "uuid";

export const ImageWithIds: BridgeExtension = ImageBridge.extendExtension({
  name: "image",

  // 1️⃣ mirror the web extension’s defaults
  addOptions() {
    return {
      ...this.parent?.(),
      inline: true,
      allowBase64: true,
      HTMLAttributes: {},
    };
  },

  // 2️⃣ add our `nodeId` attr—defaulting to a UUID—rendered as both id and data-node-id
  addAttributes() {
    return {
      ...this.parent?.(),
      nodeId: {
        default: () => uuidv4(),
        parseHTML: (el: HTMLElement): string =>
          el.getAttribute("data-node-id") ?? el.getAttribute("id") ?? uuidv4(),
        renderHTML: (attrs: { nodeId: string }): Record<string, string> => ({
          "data-node-id": attrs.nodeId,
          id: attrs.nodeId,
        }),
      },
    };
  },

  // 3️⃣ parsing logic for when the editor loads HTML
  parseHTML() {
    return [
      {
        tag: "img[src]",
        getAttrs: (dom: HTMLElement) => {
          const el = dom as HTMLElement;
          return {
            src: el.getAttribute("src"),
            alt: el.getAttribute("alt"),
            title: el.getAttribute("title"),
            nodeId:
              el.getAttribute("data-node-id") ??
              el.getAttribute("id") ??
              uuidv4(),
          };
        },
      },
    ];
  },

  // 4️⃣ ensure any inserted <img> has an ID and data-node-id
  renderHTML({ HTMLAttributes }: { HTMLAttributes: { nodeId: string } }) {
    if (!HTMLAttributes.nodeId) {
      HTMLAttributes.nodeId = uuidv4();
    }
    return [
      "img",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-node-id": HTMLAttributes.nodeId,
        id: HTMLAttributes.nodeId,
      }),
    ];
  },

  // 5️⃣ override the `setImage` command so inserted images carry our nodeId
  addCommands() {
    return {
      ...this.parent?.(),
      setImage:
        (options: Record<string, any>) =>
        ({ commands }: { commands: any }) => {
          const nodeId = uuidv4();
          return commands.insertContent({
            type: this.name,
            attrs: {
              ...options,
              nodeId,
            },
          });
        },
    };
  },
});
