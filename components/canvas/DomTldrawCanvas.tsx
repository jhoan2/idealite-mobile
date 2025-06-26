// components/canvas/DomTldrawCanvas.tsx
"use dom";

import React from "react";
import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

interface DomTldrawCanvasProps {
  pageId: string;
  initialContent?: any;
}

export default function DomTldrawCanvas({
  pageId,
  initialContent,
}: DomTldrawCanvasProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
      }}
    >
      <Tldraw key={pageId} snapshot={initialContent} />
    </div>
  );
}
