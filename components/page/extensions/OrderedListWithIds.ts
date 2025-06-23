// components/page/extensions/OrderedListWithIds.ts
import type { BridgeExtension } from "@10play/tentap-editor";
import { CoreBridge } from "@10play/tentap-editor";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { Transaction } from "@tiptap/pm/state";
import { v4 as uuidv4 } from "uuid";

export const OrderedListWithIds: BridgeExtension = CoreBridge.extendExtension({
  name: "orderedList",

  addAttributes() {
    return {
      nodeId: {
        default: null as string | null,
        parseHTML: (el: HTMLElement): string | null =>
          el.tagName === "OL" ? el.getAttribute("data-node-id") : null,
        renderHTML: (attrs: {
          nodeId?: string | null;
        }): Record<string, string> =>
          attrs.nodeId ? { "data-node-id": attrs.nodeId } : {},
      },
    };
  },

  onCreate(): void {
    const { state, view } = this.editor;
    const tr: Transaction = state.tr;
    let mutated = false;

    state.doc.descendants((node: ProseMirrorNode, pos: number) => {
      if (node.type.name === "orderedList" && !node.attrs.nodeId) {
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
