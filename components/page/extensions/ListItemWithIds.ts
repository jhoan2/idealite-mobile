// components/page/extensions/ListItemWithIds.ts

import type { BridgeExtension } from "@10play/tentap-editor";
import { CoreBridge } from "@10play/tentap-editor";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { Transaction } from "@tiptap/pm/state";
import { v4 as uuidv4 } from "uuid";

export const ListItemWithIds: BridgeExtension = CoreBridge.extendExtension({
  name: "listItem",

  addAttributes() {
    return {
      nodeId: {
        default: null as string | null,
        parseHTML: (el: HTMLElement): string | null =>
          // Only pull data-node-id off of <li> elements
          el.tagName === "LI" ? el.getAttribute("data-node-id") : null,
        renderHTML: (attrs: {
          nodeId?: string | null;
        }): Record<string, string> =>
          // Only render when present
          attrs.nodeId ? { "data-node-id": attrs.nodeId } : {},
      },
    };
  },

  onCreate(): void {
    const { state, view } = this.editor;
    const tr: Transaction = state.tr;
    let mutated = false;

    // Walk through the doc and assign UUIDs to any <li> missing nodeId
    state.doc.descendants((node: ProseMirrorNode, pos: number) => {
      if (node.type.name === "listItem" && !node.attrs.nodeId) {
        tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          nodeId: uuidv4(),
        });
        mutated = true;
      }
    });

    if (mutated) {
      view.dispatch(tr);
    }
  },
});
